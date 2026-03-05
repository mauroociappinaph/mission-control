import { StateCreator } from 'zustand'
import { MissionControlStore, Activity, Notification, LogEntry } from '../types'

export interface ActivitySlice {
  activities: Activity[]
  notifications: Notification[]
  unreadNotificationCount: number
  logs: LogEntry[]
  logFilters: {
    level?: string
    source?: string
    session?: string
    search?: string
  }

  // Actions
  setActivities: (activities: Activity[]) => void
  addActivity: (activity: Activity) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (notificationId: number) => void
  markAllNotificationsRead: () => void
  addLog: (log: LogEntry) => void
  setLogFilters: (filters: Partial<{
    level?: string
    source?: string
    session?: string
    search?: string
  }>) => void
  clearLogs: () => void
}

export const createActivitySlice: StateCreator<
  MissionControlStore,
  [['zustand/subscribeWithSelector', never]],
  [],
  ActivitySlice
> = (set) => ({
  activities: [],
  notifications: [],
  unreadNotificationCount: 0,
  logs: [],
  logFilters: {},

  setActivities: (activities) => 
    set((state) => {
      const seen = new Set()
      const unique = activities.filter(a => {
        if (seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })
      return { activities: unique }
    }),
  addActivity: (activity) =>
    set((state) => {
      if (state.activities.some(a => a.id === activity.id)) return state
      return {
        activities: [activity, ...state.activities].slice(0, 1000)
      }
    }),
  setNotifications: (notifications) =>
    set({
      notifications: (() => {
        const seen = new Set()
        return notifications.filter(n => {
          if (seen.has(n.id)) return false
          seen.add(n.id)
          return true
        })
      })(),
      unreadNotificationCount: notifications.filter(n => !n.read_at).length
    }),
  addNotification: (notification) =>
    set((state) => {
      if (state.notifications.some(n => n.id === notification.id)) return state
      return {
        notifications: [notification, ...state.notifications],
        unreadNotificationCount: state.unreadNotificationCount + 1
      }
    }),
  markNotificationRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId 
          ? { ...notification, read_at: Math.floor(Date.now() / 1000) }
          : notification
      ),
      unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1)
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.read_at ? notification : { ...notification, read_at: Math.floor(Date.now() / 1000) }
      ),
      unreadNotificationCount: 0
    })),
  addLog: (log) =>
    set((state) => {
      const existingLogIndex = state.logs.findIndex(existingLog => existingLog.id === log.id)
      if (existingLogIndex !== -1) {
        const updatedLogs = [...state.logs]
        updatedLogs[existingLogIndex] = log
        return { logs: updatedLogs }
      }
      return {
        logs: [log, ...state.logs].slice(0, 1000),
      }
    }),
  setLogFilters: (filters) =>
    set((state) => ({
      logFilters: { ...state.logFilters, ...filters },
    })),
  clearLogs: () => set({ logs: [] }),
})
