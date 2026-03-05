import { StateCreator } from 'zustand'
import { MissionControlStore, ConnectionStatus, CurrentUser } from '../types'

export interface SystemSlice {
  // Dashboard Mode
  dashboardMode: 'full' | 'local'
  gatewayAvailable: boolean
  bannerDismissed: boolean
  subscription: { type: string; rateLimitTier?: string } | null
  
  // Update availability
  updateAvailable: { latestVersion: string; releaseUrl: string; releaseNotes: string } | null
  updateDismissedVersion: string | null

  // WebSocket & Connection
  connection: ConnectionStatus
  lastMessage: any

  // Auth
  currentUser: CurrentUser | null

  // UI State
  activeTab: string
  sidebarExpanded: boolean
  collapsedGroups: string[]
  liveFeedOpen: boolean

  // Actions
  setDashboardMode: (mode: 'full' | 'local') => void
  setGatewayAvailable: (available: boolean) => void
  dismissBanner: () => void
  setSubscription: (sub: { type: string; rateLimitTier?: string } | null) => void
  setUpdateAvailable: (info: { latestVersion: string; releaseUrl: string; releaseNotes: string } | null) => void
  dismissUpdate: (version: string) => void
  setConnection: (connection: Partial<ConnectionStatus>) => void
  setLastMessage: (message: any) => void
  setActiveTab: (tab: string) => void
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  toggleGroup: (groupId: string) => void
  toggleLiveFeed: () => void
  setCurrentUser: (user: CurrentUser | null) => void
}

export const createSystemSlice: StateCreator<
  MissionControlStore,
  [['zustand/subscribeWithSelector', never]],
  [],
  SystemSlice
> = (set) => ({
  dashboardMode: 'full',
  gatewayAvailable: true,
  bannerDismissed: false,
  subscription: null,
  updateAvailable: null,
  updateDismissedVersion: (() => {
    if (typeof window === 'undefined') return null
    try { return localStorage.getItem('mc-update-dismissed-version') } catch { return null }
  })(),
  connection: {
    isConnected: false,
    url: '',
    reconnectAttempts: 0
  },
  lastMessage: null,
  currentUser: null,
  activeTab: 'overview',
  sidebarExpanded: (() => {
    if (typeof window === 'undefined') return false
    try { return localStorage.getItem('mc-sidebar-expanded') === 'true' } catch { return false }
  })(),
  collapsedGroups: (() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('mc-sidebar-groups')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })(),
  liveFeedOpen: (() => {
    if (typeof window === 'undefined') return true
    try { return localStorage.getItem('mc-livefeed-open') !== 'false' } catch { return true }
  })(),

  setDashboardMode: (mode) => set({ dashboardMode: mode }),
  setGatewayAvailable: (available) => set({ gatewayAvailable: available }),
  dismissBanner: () => set({ bannerDismissed: true }),
  setSubscription: (sub) => set({ subscription: sub }),
  setUpdateAvailable: (info) => set({ updateAvailable: info }),
  dismissUpdate: (version) => {
    try { localStorage.setItem('mc-update-dismissed-version', version) } catch {}
    set({ updateDismissedVersion: version })
  },
  setConnection: (connection) =>
    set((state) => ({ 
      connection: { ...state.connection, ...connection } 
    })),
  setLastMessage: (message) => set({ lastMessage: message }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarExpanded
      try { localStorage.setItem('mc-sidebar-expanded', String(next)) } catch {}
      return { sidebarExpanded: next }
    }),
  setSidebarExpanded: (expanded) => {
    try { localStorage.setItem('mc-sidebar-expanded', String(expanded)) } catch {}
    set({ sidebarExpanded: expanded })
  },
  toggleGroup: (groupId) =>
    set((state) => {
      const next = state.collapsedGroups.includes(groupId)
        ? state.collapsedGroups.filter(g => g !== groupId)
        : [...state.collapsedGroups, groupId]
      try { localStorage.setItem('mc-sidebar-groups', JSON.stringify(next)) } catch {}
      return { collapsedGroups: next }
    }),
  toggleLiveFeed: () =>
    set((state) => {
      const next = !state.liveFeedOpen
      try { localStorage.setItem('mc-livefeed-open', String(next)) } catch {}
      return { liveFeedOpen: next }
    }),
  setCurrentUser: (user) => set({ currentUser: user }),
})
