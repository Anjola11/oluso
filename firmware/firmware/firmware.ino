#include <Arduino.h>
#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsClient.h>
#include "secrets.h"
#include "board_config.h"

// ---------- Config ----------
constexpr bool     ENABLE_STATS            = false;
constexpr uint32_t SERIAL_WAIT_MS          = 3000;
constexpr framesize_t STREAM_FRAMESIZE     = FRAMESIZE_HVGA;   // 480x320 for 15-20 FPS over Wi-Fi
constexpr uint32_t WIFI_TIMEOUT_MS         = 20000;
constexpr uint32_t WIFI_LOST_RESTART_MS    = 30000;
constexpr uint32_t WS_RECONNECT_MS         = 2000;
constexpr uint32_t MIN_FRAME_INTERVAL_MS   = 50;   // ~20 FPS cap; raise to slow down
constexpr uint32_t STATS_INTERVAL_MS       = 5000;
constexpr uint8_t  MAX_CAPTURE_FAILURES    = 10;
// Set to true to append the last 4 hex characters of the board's MAC address
// (e.g. "camera-001-3A2F") to guarantee uniqueness across multiple ESPs.
constexpr bool     APPEND_MAC_TO_ID        = false;

WebSocketsClient ws;
String wsPath = String("/ws/device/") + DEVICE_ID;

// ---------- Helpers ----------
static void restartAfter(const char *reason, uint32_t ms) {
  Serial.printf("%s Restarting in %u ms\n", reason, (unsigned)ms);
  delay(ms);
  ESP.restart();
}

static void onWsEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.printf("[WS] connected: %s\n", (const char *)payload);
      break;
    case WStype_DISCONNECTED:
      Serial.println("[WS] disconnected (will auto-retry)");
      break;
    case WStype_TEXT:
      if (ENABLE_STATS) {
        Serial.printf("[WS] text: %.*s\n", (int)length, (const char *)payload);
      }
      break;
    case WStype_ERROR:
      Serial.println("[WS] error");
      break;
    default:
      break;
  }
}

// ---------- Setup ----------
void setup() {
  Serial.begin(115200);
  uint32_t t0 = millis();
  while (!Serial && millis() - t0 < SERIAL_WAIT_MS) {
    delay(10);
  }

  Serial.println("===Booting===\n");
  bool hasPsram = psramFound();
  Serial.printf("PSRAM Available: %s\n", hasPsram ? "YES" : "NO");
  if (hasPsram) {
    Serial.printf("Total PSRAM: %u KB, Free PSRAM: %u KB\n",
                  (unsigned)(ESP.getPsramSize() / 1024),
                  (unsigned)(ESP.getFreePsram() / 1024));
  } else {
    Serial.println("WARNING: no PSRAM. Check Tools > PSRAM setting.");
  }

  camera_config_t config = {};
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk  = XCLK_GPIO_NUM;
  config.pin_pclk  = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href  = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn  = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size   = STREAM_FRAMESIZE;

  if (hasPsram) {
    config.jpeg_quality = 12;               // 10 = better quality/bigger frames
    config.fb_count     = 2;
    config.fb_location  = CAMERA_FB_IN_PSRAM;
    config.grab_mode    = CAMERA_GRAB_LATEST;
  } else {
    config.jpeg_quality = 12;
    config.fb_count     = 1;
    config.fb_location  = CAMERA_FB_IN_DRAM;
    config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    restartAfter("Camera init failure", 5000);
  }

  sensor_t *s = esp_camera_sensor_get();
  if (s == nullptr) restartAfter("Sensor not detected", 5000);
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
#if defined(CAMERA_MODEL_ESP32S3_EYE)
  s->set_vflip(s, 1);
#endif

  // Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < WIFI_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() != WL_CONNECTED) {
    restartAfter("WiFi connection failed", 5000);
  }
  Serial.printf("WiFi connected, IP: %s\n", WiFi.localIP().toString().c_str());

  // Derive device ID and WebSocket path
  String effectiveDeviceId = DEVICE_ID;
  if (APPEND_MAC_TO_ID) {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char macSuffix[8];
    snprintf(macSuffix, sizeof(macSuffix), "-%02X%02X", mac[4], mac[5]);
    effectiveDeviceId += macSuffix;
  }
  wsPath = String("/ws/device/") + effectiveDeviceId;
  Serial.printf("Device ID: %s\n", effectiveDeviceId.c_str());

  // WebSocket client
  if (SERVER_PORT == 443) {
    ws.beginSSL(SERVER_HOST, SERVER_PORT, wsPath.c_str());
    Serial.printf("Streaming to wss://%s:%d%s\n", SERVER_HOST, SERVER_PORT, wsPath.c_str());
  } else {
    ws.begin(SERVER_HOST, SERVER_PORT, wsPath.c_str());
    Serial.printf("Streaming to ws://%s:%d%s\n", SERVER_HOST, SERVER_PORT, wsPath.c_str());
  }
  ws.onEvent(onWsEvent);
  ws.setReconnectInterval(WS_RECONNECT_MS);
  ws.enableHeartbeat(15000, 3000, 2);  // ping every 15s, 3s pong timeout, 2 misses -> drop
}

// ---------- Loop ----------
static void watchWifi() {
  static uint32_t lostSince = 0;
  if (WiFi.status() == WL_CONNECTED) {
    lostSince = 0;
  } else if (lostSince == 0) {
    lostSince = millis();
    Serial.println("WiFi lost, waiting for auto-reconnect...");
  } else if (millis() - lostSince > WIFI_LOST_RESTART_MS) {
    restartAfter("WiFi down too long", 500);
  }
}

static void sendOneFrame() {
  static uint8_t  captureFailures = 0;
  static uint32_t frames = 0, sendFailures = 0, bytes = 0, statsSince = millis();

  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Capture failed");
    if (++captureFailures >= MAX_CAPTURE_FAILURES) {
      restartAfter("Too many capture failures", 500);
    }
    return;
  }
  captureFailures = 0;

  size_t len = fb->len;
  // Note: the library masks the payload in place (WebSocket clients must),
  // so never read fb->buf after sendBIN.
  bool ok = ws.sendBIN(fb->buf, len);
  esp_camera_fb_return(fb);

  if (ok) {
    frames++;
    bytes += len;
  } else {
    sendFailures++;
  }

  uint32_t elapsed = millis() - statsSince;
  if (elapsed >= STATS_INTERVAL_MS) {
    float fps  = frames * 1000.0f / elapsed;
    float kbps = bytes * 8.0f / elapsed;  // bits/ms == kbit/s
    float avgKB = frames ? (bytes / 1024.0f) / frames : 0;
    if (ENABLE_STATS) {
      Serial.printf("[STATS] %.1f FPS | avg %.1f KB/frame | %.0f kbit/s | send failures: %u | heap: %u | psram: %u\n",
                    fps, avgKB, kbps, (unsigned)sendFailures,
                    (unsigned)ESP.getFreeHeap(), (unsigned)ESP.getFreePsram());
    }
    frames = sendFailures = bytes = 0;
    statsSince = millis();
  }
}

void loop() {
  static uint32_t lastFrameMs = 0;

  watchWifi();
  ws.loop();  // must run often; handles reconnect, pings, events

  if (!ws.isConnected()) {
    delay(10);
    return;
  }

  uint32_t now = millis();
  if (now - lastFrameMs >= MIN_FRAME_INTERVAL_MS) {
    lastFrameMs = now;
    sendOneFrame();
  }
}