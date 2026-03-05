import { StateCreator } from 'zustand'
import { MissionControlStore, Task, Comment, StandupReport } from '../types'

export interface TaskSlice {
  tasks: Task[]
  selectedTask: Task | null
  taskComments: Record<number, Comment[]>
  standupReports: StandupReport[]
  currentStandupReport: StandupReport | null

  // Actions
  setTasks: (tasks: Task[]) => void
  setSelectedTask: (task: Task | null) => void
  addTask: (task: Task) => void
  updateTask: (taskId: number, updates: Partial<Task>) => void
  deleteTask: (taskId: number) => void
  setTaskComments: (taskId: number, comments: Comment[]) => void
  addTaskComment: (taskId: number, comment: Comment) => void
  setStandupReports: (reports: StandupReport[]) => void
  setCurrentStandupReport: (report: StandupReport | null) => void
}

export const createTaskSlice: StateCreator<
  MissionControlStore,
  [['zustand/subscribeWithSelector', never]],
  [],
  TaskSlice
> = (set) => ({
  tasks: [],
  selectedTask: null,
  taskComments: {},
  standupReports: [],
  currentStandupReport: null,

  setTasks: (tasks) => 
    set((state) => {
      const seen = new Set()
      const unique = tasks.filter(t => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })
      return { tasks: unique }
    }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  addTask: (task) =>
    set((state) => {
      if (state.tasks.some(t => t.id === task.id)) return state
      return {
        tasks: [task, ...state.tasks]
      }
    }),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
      selectedTask: state.selectedTask?.id === taskId
        ? { ...state.selectedTask, ...updates }
        : state.selectedTask
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
      selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask
    })),
  setTaskComments: (taskId, comments) =>
    set((state) => ({
      taskComments: { ...state.taskComments, [taskId]: comments }
    })),
  addTaskComment: (taskId, comment) =>
    set((state) => ({
      taskComments: {
        ...state.taskComments,
        [taskId]: [comment, ...(state.taskComments[taskId] || [])]
      }
    })),
  setStandupReports: (reports) => set({ standupReports: reports }),
  setCurrentStandupReport: (report) => set({ currentStandupReport: report }),
})
