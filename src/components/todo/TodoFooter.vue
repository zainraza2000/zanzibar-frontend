<script setup>
import { computed } from 'vue'

const props = defineProps(['todos', 'currentFilter'])
const emit = defineEmits(['delete-completed', 'set-filter'])
const remaining = computed(() => props.todos.filter((todo) => !todo.completed).length)

function handleFilterClick(filter) {
  emit('set-filter', filter)
}
</script>

<template>
  <footer class="footer" v-show="todos.length > 0">
    <span class="todo-count">
      <strong>{{ remaining }}</strong> {{ remaining === 1 ? 'item' : 'items' }} left
    </span>
    <ul class="filters">
      <li>
        <button
          @click="handleFilterClick('all')"
          :class="{ selected: currentFilter === 'all' }"
          class="filter-button"
        >
          All
        </button>
      </li>
      <li>
        <button
          @click="handleFilterClick('active')"
          :class="{ selected: currentFilter === 'active' }"
          class="filter-button"
        >
          Active
        </button>
      </li>
      <li>
        <button
          @click="handleFilterClick('completed')"
          :class="{ selected: currentFilter === 'completed' }"
          class="filter-button"
        >
          Completed
        </button>
      </li>
    </ul>
    <button
      class="clear-completed"
      v-show="todos.some((todo) => todo.completed)"
      @click="$emit('delete-completed')"
    >
      Clear Completed
    </button>
  </footer>
</template>
