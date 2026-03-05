import { StateCreator } from 'zustand'
import { MissionControlStore, Agent, SpawnRequest } from '../types'

export interface AgentSlice {
  agents: Agent[]
  selectedAgent: Agent | null
  spawnRequests: SpawnRequest[]

  // Actions
  setAgents: (agents: Agent[]) => void
  setSelectedAgent: (agent: Agent | null) => void
  addAgent: (agent: Agent) => void
  updateAgent: (agentId: number, updates: Partial<Agent>) => void
  deleteAgent: (agentId: number) => void
  addSpawnRequest: (request: SpawnRequest) => void
  updateSpawnRequest: (id: string, updates: Partial<SpawnRequest>) => void
}

export const createAgentSlice: StateCreator<
  MissionControlStore,
  [['zustand/subscribeWithSelector', never]],
  [],
  AgentSlice
> = (set) => ({
  agents: [],
  selectedAgent: null,
  spawnRequests: [],

  setAgents: (agents) => 
    set((state) => {
      const seen = new Set()
      const unique = agents.filter(a => {
        if (seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })
      return { agents: unique }
    }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  addAgent: (agent) =>
    set((state) => {
      if (state.agents.some(a => a.id === agent.id)) return state
      return {
        agents: [agent, ...state.agents]
      }
    }),
  updateAgent: (agentId, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, ...updates } : agent
      ),
      selectedAgent: state.selectedAgent?.id === agentId
        ? { ...state.selectedAgent, ...updates }
        : state.selectedAgent
    })),
  deleteAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.filter((agent) => agent.id !== agentId),
      selectedAgent: state.selectedAgent?.id === agentId ? null : state.selectedAgent
    })),
  addSpawnRequest: (request) =>
    set((state) => ({
      spawnRequests: [request, ...state.spawnRequests],
    })),
  updateSpawnRequest: (id, updates) =>
    set((state) => ({
      spawnRequests: state.spawnRequests.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      ),
    })),
})
