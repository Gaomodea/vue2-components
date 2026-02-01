<template>
  <editor-container
    :collapseSlider="collapseSlider"
    :fullscreenPreivew="fullscreenPreivew"
  >
    <template #slider>
      <div>alfkjasldfjlksajfks</div>
    </template>
    
    <template #body>
      <div>alfkjasldfjlksajfks</div>
    </template>

    <template #preview>
      <div>
        <div>falskdask</div>
        <button @click="fullscreenPreivew = !fullscreenPreivew">全屏</button>
      </div>
    </template>
  </editor-container>
</template>

<script>
import EditorContainer from './EditorContainer/index.vue'
export default {
  name: 'IndexEditor',

  components: {
    EditorContainer
  },

  data () {
    return {
      collapseSlider: false,
      fullscreenPreivew: false
    }
  },
}
</script>

<style>

</style>