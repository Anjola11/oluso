import { useState, useCallback } from 'react'

export type ActivityType = 'online' | 'offline' | 'reconnecting' | 'error'

export interface ActivityEvent {
  id: string
  type: ActivityType
  title: string
  timestamp: Date
}

export function useActivityLog() {
  const [events, setEvents] = useState<ActivityEvent[]>([])

  const addEvent = useCallback((type: ActivityType, title: string) => {
    setEvents((prev) => {
      // Dedupe consecutive identical events
      if (prev.length > 0 && prev[0].title === title && prev[0].type === type) {
        return prev
      }

      const newEvent: ActivityEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        title,
        timestamp: new Date(),
      }

      // Keep latest 50
      return [newEvent, ...prev.slice(0, 49)]
    })
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return { events, addEvent, clearEvents }
}
