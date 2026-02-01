<script>
import IndexEditor from './pages/editor/index.vue'

export default {
  components: {
    IndexEditor
  }
}
</script>

<template>
  <div class="body">
    <IndexEditor />
  </div>
</template>

<style scoped>
.body {
  height: 100vh;
  padding: 32px;
  box-sizing: border-box;
  background: #ccc;
}
</style>
