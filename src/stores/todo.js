import { defineStore, acceptHMRUpdate } from 'pinia'
import { Notify } from 'quasar'
import axios from 'config/axios'

const STORAGE_KEYS = {
  TODOS: 'todos',
  CURRENT_FILTER: 'currentFilter',
}

const getInitialState = () => ({
  todos: [],
  currentFilter: 'pending', // Default to pending filter
  loading: false,
  error: null,
})

export const useTodoStore = defineStore('todo', {
  state: getInitialState,

  getters: {
    filteredTodos: (state) => {
      if (state.currentFilter === 'all') {
        return state.todos
      }
      return state.todos.filter((todo) => todo.status === state.currentFilter)
    },
    pendingTodosCount: (state) => {
      return state.todos.filter((todo) => todo.status === 'pending').length
    },
    completedTodosCount: (state) => {
      return state.todos.filter((todo) => todo.status === 'complete').length
    },
    totalTodosCount: (state) => {
      return state.todos.length
    },
    hasTodos: (state) => {
      return state.todos.length > 0
    },
    getTodoById: (state) => (id) => {
      return state.todos.find((todo) => todo.entity_id === id)
    },
  },

  actions: {
    showErrorNotification(message = 'An unknown error occurred') {
      Notify.create({
        message,
        color: 'negative',
        position: 'top',
        timeout: 5000,
      })
    },
    showSuccessNotification(message) {
      Notify.create({
        message,
        color: 'positive',
        position: 'top',
        timeout: 3000,
      })
    },
    handleApiError(error, defaultMessage = 'An unknown error occurred') {
      const message = error.response?.data?.message || error.message || defaultMessage
      this.error = message
      this.showErrorNotification(message)
      return false
    },
    setFilter(filter) {
      this.currentFilter = filter
      localStorage.setItem(STORAGE_KEYS.CURRENT_FILTER, filter)
    },

    async setFilterAndFetch(filter) {
      this.currentFilter = filter
      localStorage.setItem(STORAGE_KEYS.CURRENT_FILTER, filter)

      if (filter !== 'all') {
        await this.fetchTodos(filter)
      } else {
        await this.fetchTodos() // Fetch all todos
      }
    },
    setTodos(todos) {
      this.todos = todos
      this.error = null
    },
    addTodo(todo) {
      this.todos.unshift(todo) // Add to beginning of list
    },
    updateTodo(updatedTodo) {
      const index = this.todos.findIndex((todo) => todo.entity_id === updatedTodo.entity_id)
      if (index !== -1) {
        this.todos[index] = updatedTodo
      }
    },
    removeTodo(todoId) {
      const index = this.todos.findIndex((todo) => todo.entity_id === todoId)
      if (index !== -1) {
        this.todos.splice(index, 1)
      }
    },
    async fetchTodos() {
      this.loading = true
      this.error = null

      try {
        const status = this.currentFilter === 'all' ? undefined : this.currentFilter
        const params = { status }
        const response = await axios.get('/todo/', { params })

        if (response.data?.success) {
          this.setTodos(response.data.todos || [])
          return true
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to fetch todos')
          return false
        }
      } catch (error) {
        return this.handleApiError(error, 'Failed to fetch todos')
      } finally {
        this.loading = false
      }
    },
    async createTodo(todoData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('/todo/', todoData)

        if (response.data?.success) {
          const newTodo = response.data.todo
          this.addTodo(newTodo)
          this.showSuccessNotification('Todo created successfully!')
          return { success: true, todo: newTodo }
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to create todo')
          return { success: false, message: response.data?.message }
        }
      } catch (error) {
        const errorMessage = this.handleApiError(error, 'Failed to create todo')
        return { success: false, message: errorMessage }
      } finally {
        this.loading = false
      }
    },
    async updateTodoById(todoId, updateData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.put(`/todo/${todoId}`, updateData)

        if (response.data?.success) {
          const updatedTodo = response.data.todo
          this.updateTodo(updatedTodo)
          this.showSuccessNotification('Todo updated successfully!')
          return { success: true, todo: updatedTodo }
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to update todo')
          return { success: false, message: response.data?.message }
        }
      } catch (error) {
        const errorMessage = this.handleApiError(error, 'Failed to update todo')
        return { success: false, message: errorMessage }
      } finally {
        this.loading = false
      }
    },
    async deleteTodo(todoId) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.delete(`/todo/${todoId}`)

        if (response.data?.success) {
          this.removeTodo(todoId)
          this.showSuccessNotification('Todo deleted successfully!')
          return { success: true }
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to delete todo')
          return { success: false, message: response.data?.message }
        }
      } catch (error) {
        const errorMessage = this.handleApiError(error, 'Failed to delete todo')
        return { success: false, message: errorMessage }
      } finally {
        this.loading = false
      }
    },
    async toggleTodoStatus(todoId) {
      const todo = this.getTodoById(todoId)
      if (!todo) {
        this.showErrorNotification('Todo not found')
        return { success: false, message: 'Todo not found' }
      }

      const newStatus = todo.status === 'pending' ? 'complete' : 'pending'
      return await this.updateTodoById(todoId, { status: newStatus })
    },
    async updateTodoDescription(todoId, description) {
      return await this.updateTodoById(todoId, { description })
    },
    clearError() {
      this.error = null
    },
    initialize() {
      // Load filter from localStorage
      const savedFilter = localStorage.getItem(STORAGE_KEYS.CURRENT_FILTER)
      if (savedFilter) {
        this.currentFilter = savedFilter
      }
    },
    reset() {
      this.todos = []
      this.currentFilter = 'pending'
      this.loading = false
      this.error = null
    },
  },
})

// Hot Module Replacement support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTodoStore, import.meta.hot))
}
