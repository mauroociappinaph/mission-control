import { StateCreator } from 'zustand'
import { MissionControlStore, Session, CronJob, MemoryFile, TokenUsage, ModelConfig } from '../types'
import { MODEL_CATALOG } from '@/lib/models'

export interface ResourceSlice {
  sessions: Session[]
  selectedSession: string | null
  cronJobs: CronJob[]
  memoryFiles: MemoryFile[]
  selectedMemoryFile: string | null
  memoryContent: string | null
  tokenUsage: TokenUsage[]
  availableModels: ModelConfig[]

  // Actions
  setSessions: (sessions: Session[]) => void
  setSelectedSession: (sessionId: string | null) => void
  updateSession: (sessionId: string, updates: Partial<Session>) => void
  setCronJobs: (jobs: CronJob[]) => void
  updateCronJob: (name: string, updates: Partial<CronJob>) => void
  setMemoryFiles: (files: MemoryFile[]) => void
  setSelectedMemoryFile: (path: string | null) => void
  setMemoryContent: (content: string | null) => void
  addTokenUsage: (usage: TokenUsage) => void
  getUsageByModel: (timeframe: 'day' | 'week' | 'month') => Record<string, number>
  getTotalCost: (timeframe: 'day' | 'week' | 'month') => number
  setAvailableModels: (models: ModelConfig[]) => void
}

export const createResourceSlice: StateCreator<
  MissionControlStore,
  [['zustand/subscribeWithSelector', never]],
  [],
  ResourceSlice
> = (set, get) => ({
  sessions: [],
  selectedSession: null,
  cronJobs: [],
  memoryFiles: [],
  selectedMemoryFile: null,
  memoryContent: null,
  tokenUsage: [],
  availableModels: [...MODEL_CATALOG],

  setSessions: (sessions) => set({ sessions }),
  setSelectedSession: (sessionId) => set({ selectedSession: sessionId }),
  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session
      ),
    })),
  setCronJobs: (jobs) => set({ cronJobs: jobs }),
  updateCronJob: (name, updates) =>
    set((state) => ({
      cronJobs: state.cronJobs.map((job) =>
        job.name === name ? { ...job, ...updates } : job
      ),
    })),
  setMemoryFiles: (files) => set({ memoryFiles: files }),
  setSelectedMemoryFile: (path) => set({ selectedMemoryFile: path }),
  setMemoryContent: (content) => set({ memoryContent: content }),
  addTokenUsage: (usage) =>
    set((state) => ({
      tokenUsage: [...state.tokenUsage, usage],
    })),
  getUsageByModel: (timeframe) => {
    const { tokenUsage } = get()
    const now = new Date()
    let cutoff: Date

    switch (timeframe) {
      case 'day':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        cutoff = new Date(0)
    }

    return tokenUsage
      .filter((usage) => new Date(usage.date) >= cutoff)
      .reduce((acc, usage) => {
        acc[usage.model] = (acc[usage.model] || 0) + usage.totalTokens
        return acc
      }, {} as Record<string, number>)
  },
  getTotalCost: (timeframe) => {
    const { tokenUsage } = get()
    const now = new Date()
    let cutoff: Date

    switch (timeframe) {
      case 'day':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        cutoff = new Date(0)
    }

    return tokenUsage
      .filter((usage) => new Date(usage.date) >= cutoff)
      .reduce((acc, usage) => acc + usage.cost, 0)
  },
  setAvailableModels: (models) => set({ availableModels: models }),
})
