<template>
  <q-page class="q-pa-md">
    <div class="todo-app">
      <TodoHeader @add-todo="addTodo" />
      <main class="main" v-show="todoStore.hasTodos">
        <div class="toggle-all-container">
          <input type="checkbox" id="toggle-all-input" class="toggle-all" v-model="toggleAllModel"
            :disabled="filteredTodos.length === 0" />
          <label class="toggle-all-label" htmlFor="toggle-all-input"> Toggle All Input </label>
        </div>
        <ul class="todo-list">
          <TodoItem v-for="(todo, index) in filteredTodos" :key="todo.entity_id" :todo="mappedTodo(todo)" :index="index"
            @delete-todo="deleteTodo" @edit-todo="editTodo" @toggle-todo="toggleTodo" />
        </ul>
      </main>
      <TodoFooter :todos="mappedTodos" :current-filter="currentFilter" @delete-completed="deleteCompleted"
        @set-filter="setFilter" />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'

import TodoFooter from '@/components/todo/TodoFooter.vue'
import TodoHeader from '@/components/todo/TodoHeader.vue'
import TodoItem from '@/components/todo/TodoItem.vue'
import { useTodoStore } from 'src/stores/todo'

const todoStore = useTodoStore()

// Map store filter values to component filter values
const filterMapping = {
  'all': 'all',
  'pending': 'active',
  'complete': 'completed'
}

const currentFilter = computed(() => filterMapping[todoStore.currentFilter] || 'all')

const mappedTodos = computed(() => {
  return todoStore.todos.map(todo => ({
    ...todo,
    completed: todo.status === 'complete',
    title: todo.description
  }))
})

const filteredTodos = computed(() => {
  return todoStore.filteredTodos.map(todo => ({
    ...todo,
    completed: todo.status === 'complete',
    title: todo.description
  }))
})

const toggleAllModel = computed({
  get() {
    return todoStore.pendingTodosCount === 0 && todoStore.totalTodosCount > 0
  },
  async set(value) {
    const newStatus = value ? 'complete' : 'pending'
    for (const todo of todoStore.todos) {
      await todoStore.updateTodoById(todo.entity_id, { status: newStatus })
    }
  },
})

function mappedTodo(todo) {
  return {
    ...todo,
    completed: todo.status === 'complete',
    title: todo.description
  }
}

async function addTodo(value) {
  await todoStore.createTodo({ description: value, status: 'pending' })
}

async function deleteTodo(todo) {
  const originalTodo = todoStore.todos.find(t => t.description === todo.title)
  if (originalTodo) {
    await todoStore.deleteTodo(originalTodo.entity_id)
  }
}

async function toggleTodo(todo) {
  const originalTodo = todoStore.todos.find(t => t.description === todo.title)
  if (originalTodo) {
    await todoStore.toggleTodoStatus(originalTodo.entity_id)
  }
}

async function editTodo(todo, value) {
  const originalTodo = todoStore.todos.find(t => t.description === todo.title)
  if (originalTodo) {
    await todoStore.updateTodoDescription(originalTodo.entity_id, value)
  }
}

async function deleteCompleted() {
  const completedTodos = todoStore.todos.filter(todo => todo.status === 'complete')
  for (const todo of completedTodos) {
    await todoStore.deleteTodo(todo.entity_id)
  }
}

function setFilter(filter) {
  const reverseFilterMapping = {
    'all': 'all',
    'active': 'pending',
    'completed': 'complete'
  }
  const storeFilter = reverseFilterMapping[filter] || 'all'
  todoStore.setFilter(storeFilter)
}

onMounted(async () => {
  todoStore.initialize()
  await todoStore.fetchTodos()
})
</script>
