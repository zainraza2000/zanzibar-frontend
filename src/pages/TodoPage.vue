<template>
  <q-page class="q-pa-md">
    <div class="todo-app">
      <TodoHeader @add-todo="addTodo" />
      <main class="main" v-show="!todoStore.loading">
        <div class="toggle-all-container" v-show="todoStore.hasTodos">
          <input type="checkbox" id="toggle-all-input" class="toggle-all" v-model="toggleAllModel"
            :disabled="filteredTodos.length === 0" />
          <label class="toggle-all-label" htmlFor="toggle-all-input"> Toggle All Input </label>
        </div>
        <ul class="todo-list">
          <TodoItem v-for="(todo, index) in filteredTodos" :key="todo.entity_id" :todo="mappedTodo(todo)" :index="index"
            @delete-todo="deleteTodo" @edit-todo="editTodo" @toggle-todo="toggleTodo" />
        </ul>
        <div v-if="!todoStore.hasTodos && !todoStore.loading" class="no-todos">
          <p>No todos found. Add one above to get started!</p>
        </div>
      </main>
      <TodoFooter :todos="mappedTodos" :current-filter="currentFilter" @delete-completed="deleteCompleted"
        @set-filter="setFilter" />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, nextTick } from 'vue'

import TodoFooter from '@/components/todo/TodoFooter.vue'
import TodoHeader from '@/components/todo/TodoHeader.vue'
import TodoItem from '@/components/todo/TodoItem.vue'
import { useTodoStore } from 'src/stores/todo'
import { useAuthStore } from 'src/stores/auth'

const todoStore = useTodoStore()
const authStore = useAuthStore()

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
  authStore.initialize()
  todoStore.initialize()

  await nextTick()

  if (authStore.isAuthenticated) {
    await todoStore.fetchTodos()
  }
})
</script>

<style>
.todo-app {
  min-width: 300px;
  max-width: 582px;
  width: 100%;
  margin: 0 auto;
  display: block;
  box-sizing: border-box;
  margin-top: 20px;
}

.todo-app .header h1 {
  position: absolute;
  top: -140px;
  width: 100%;
  font-size: 80px;
  font-weight: 200;
  text-align: center;
  color: #b83f45;
  -webkit-text-rendering: optimizeLegibility;
  -moz-text-rendering: optimizeLegibility;
  text-rendering: optimizeLegibility;
}

.todo-app .new-todo {
  position: relative;
  margin: 0;
  width: 100%;
  font-size: 24px;
  font-family: inherit;
  font-weight: inherit;
  line-height: 1.4em;
  color: inherit;
  padding: 16px 16px 16px 60px;
  height: 65px;
  border: none;
  background: rgba(0, 0, 0, 0.003);
  box-shadow: inset 0 -2px 1px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.todo-app .new-todo::-webkit-input-placeholder {
  font-style: italic;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.4);
}

.todo-app .new-todo::-moz-placeholder {
  font-style: italic;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.4);
}

.todo-app .new-todo::input-placeholder {
  font-style: italic;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.4);
}

.todo-app .main {
  position: relative;
  z-index: 2;
  border-top: 1px solid #e6e6e6;
}

.todo-app .toggle-all {
  width: 1px;
  height: 1px;
  border: none;
  opacity: 0;
  position: absolute;
  right: 100%;
  bottom: 100%;
}

.todo-app .toggle-all+label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 65px;
  font-size: 0;
  position: absolute;
  top: -65px;
  left: -0;
}

.todo-app .toggle-all+label:before {
  content: '❯';
  display: inline-block;
  font-size: 22px;
  color: #949494;
  padding: 10px 27px 10px 27px;
  -webkit-transform: rotate(90deg);
  transform: rotate(90deg);
}

.todo-app .toggle-all:checked+label:before {
  color: #484848;
}

.todo-app .toggle-all-label {
  pointer-events: none;
}

.todo-app .todo-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.todo-app .todo-list li {
  position: relative;
  font-size: 24px;
  border-bottom: 1px solid #ededed;
}

.todo-app .todo-list li:last-child {
  border-bottom: none;
}

.todo-app .todo-list li.editing {
  border-bottom: none;
  padding: 0;
}

.todo-app .todo-list li.editing .edit {
  display: block;
  width: calc(100% - 43px);
  padding: 12px 16px;
  margin: 0 0 0 43px;
}

.todo-app .todo-list li.editing .view {
  display: none;
}

.todo-app .todo-list li .toggle {
  text-align: center;
  width: 40px;
  height: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto 0;
  border: none;
  -webkit-appearance: none;
  appearance: none;
  opacity: 0;
}

.todo-app .todo-list li .toggle+label {
  background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23949494%22%20stroke-width%3D%223%22/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: center left;
}

.todo-app .todo-list li .toggle:checked+label {
  background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%2359A193%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20fill%3D%22%233EA390%22%20d%3D%22M72%2025L42%2071%2027%2056l-4%204%2020%2020%2034-52z%22%2F%3E%3C%2Fsvg%3E');
}

.todo-app .todo-list li label {
  overflow-wrap: break-word;
  padding: 15px 15px 15px 60px;
  display: block;
  line-height: 1.2;
  transition: color 0.4s;
  font-weight: 400;
  color: #484848;
}

.todo-app .todo-list li.completed label {
  color: #949494;
  text-decoration: line-through;
}

.todo-app .todo-list li .destroy {
  display: none;
  position: absolute;
  top: 0;
  right: 10px;
  bottom: 0;
  width: 40px;
  height: 40px;
  margin: auto 0;
  font-size: 30px;
  color: #949494;
  transition: color 0.2s ease-out;
}

.todo-app .todo-list li .destroy:hover,
.todo-app .todo-list li .destroy:focus {
  color: #c18585;
}

.todo-app .todo-list li .destroy:after {
  content: '×';
  display: block;
  height: 100%;
  line-height: 1.1;
}

.todo-app .todo-list li:hover .destroy {
  display: block;
}

.todo-app .todo-list li .edit {
  display: none;
}

.todo-app .todo-list li.editing:last-child {
  margin-bottom: -1px;
}

.todo-app .footer {
  padding: 10px 15px;
  height: 20px;
  text-align: center;
  font-size: 15px;
  border-top: 1px solid #e6e6e6;
}

.todo-app .footer:before {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 50px;
  overflow: hidden;
  box-shadow:
    0 1px 1px rgba(0, 0, 0, 0.2),
    0 8px 0 -3px #f6f6f6,
    0 9px 1px -3px rgba(0, 0, 0, 0.2),
    0 16px 0 -6px #f6f6f6,
    0 17px 2px -6px rgba(0, 0, 0, 0.2);
}

.todo-app .todo-count {
  float: left;
  text-align: left;
}

.todo-app .todo-count strong {
  font-weight: 300;
}

.todo-app .filters {
  margin: 0;
  padding: 0;
  list-style: none;
  position: absolute;
  right: 0;
  left: 0;
}

.todo-app .filters li {
  display: inline;
}

.todo-app .filters li .filter-button {
  color: inherit;
  margin: 3px;
  padding: 3px 7px;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 3px;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

.todo-app .filters li .filter-button:hover {
  border-color: #db7676;
}

.todo-app .filters li .filter-button.selected {
  border-color: #ce4646;
}

.todo-app .clear-completed {
  float: right;
  position: relative;
  line-height: 19px;
  text-decoration: none;
  cursor: pointer;
}

.todo-app .clear-completed:hover {
  text-decoration: underline;
}

@media screen and (-webkit-min-device-pixel-ratio: 0) {

  .todo-app .toggle-all,
  .todo-app .todo-list li .toggle {
    background: none;
  }

  .todo-app .todo-list li .toggle {
    height: 40px;
  }
}

@media (max-width: 430px) {
  .todo-app .footer {
    height: 50px;
  }

  .todo-app .filters {
    bottom: 10px;
  }
}

:focus,
.todo-app .toggle:focus+label,
.todo-app .toggle-all:focus+label {
  box-shadow: 0 0 2px 2px #cf7d7d;
  outline: 0;
}

.todo-app .visually-hidden {
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
}
</style>
