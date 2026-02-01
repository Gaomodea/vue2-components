<template>
  <split-pane>
    <split-pane-content
      pane-id="slider"
      :collapse.sync="collapseSlider"
      :width="200"
      :min-width="200"
      :draggable="true"
    >
      <slot name="slider"></slot>
    </split-pane-content>

    <split-pane-content
      pane-id="body"
      :min-width="300"
    >
      <slot name="body"></slot>
    </split-pane-content>

    <split-pane-content
      pane-id="preview"
      :width="500"
      :min-width="300"
      :draggable="true"
      :fullscreen.sync="fullscreenPreivew"
    >
      <slot name="preview"></slot>
    </split-pane-content>
  </split-pane>
</template>

<script>
import SplitPane from '../../../components/SplitPane/SplitPane.vue'
import SplitPaneContent from '../../../components/SplitPane/SplitPaneContent.vue'

export default {
  name: 'EditorContainer',

  components: {
    SplitPane,
    SplitPaneContent
  },

  props: {
    collapseSlider: {
      type: Boolean,
      default: false
    },

    fullscreenPreivew: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style>

</style>