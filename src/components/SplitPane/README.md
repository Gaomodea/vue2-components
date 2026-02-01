# 三栏拖拽调整宽度组件

```vue
<template>
  <SplitPane>
    <SplitPaneContent
      :width="400"
      :min-width="300"
      :collapse.sync="collapse"
      :draggable="true"
    >
      <div>left content</div>
    </SplitPaneContent>
    <SplitPaneContent
      :min-width="400"
    >
      <div>body content</div>
    </SplitPaneContent>
    <SplitPaneContent
      :width="500"
      :min-width="400"
      :fullscreen.sync="fullscreen"
      :draggable="true"
    >
      <div>right content</div>
    </SplitPaneContent>
  </SplitPane>
</template>

<script lang="ts">
export defualt {
  methods: {
    handleFullScreen() {
      this.fullscreen = !this.fullscreen
    },

    handleCollapse() {
      this.collapse = !this.collapse
    }
  }
}
</script>
```