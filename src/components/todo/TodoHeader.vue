<template>
  <header class="header">
    <h1>todos</h1>
    <input type="text" class="new-todo" autofocus autocomplete="off" placeholder="What needs to be done?" @keyup.enter="
      // @ts-ignore
      $emit('add-todo', $event.target.value)
    // @ts-ignore
    $event.target.value = '';
    " />
  </header>
</template>
