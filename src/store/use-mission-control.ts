'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { MissionControlStore } from './types'
import { createSystemSlice } from './slices/system-slice'
import { createTaskSlice } from './slices/task-slice'
import { createAgentSlice } from './slices/agent-slice'
import { createActivitySlice } from './slices/activity-slice'
import { createChatSlice } from './slices/chat-slice'
import { createResourceSlice } from './slices/resource-slice'

export const useMissionControl = create<MissionControlStore>()(
  subscribeWithSelector((...a) => ({
    ...createSystemSlice(...a),
    ...createTaskSlice(...a),
    ...createAgentSlice(...a),
    ...createActivitySlice(...a),
    ...createChatSlice(...a),
    ...createResourceSlice(...a),
  }))
)
