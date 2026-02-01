<template>
  <div class="split-pane" :class="classes" ref="splitPane">
    <slot></slot>
  </div>
</template>

<script>
import { splitPaneProps } from './props'
import { createDragMixin } from './dragMixin'

export default {
  name: 'SplitPane',

  props: splitPaneProps,

  mixins: [
    createDragMixin()
  ],

  data () {
    return {
      normaled: false,
      collapseWidth: new WeakMap()
    }
  },

  provide () {
    return {
      registryPaneContent: this.registryPaneContent,
      unregistryPaneContent: this.unregistryPaneContent,
      handleCollapse: this.handleCollapse
    }
  },

  computed: {
    classes () {
      return {
        'split-pane--normaled': this.normaled
      }
    }
  },

  mounted () {
    this.normalizeWidth()
    this.observeResize()
  },

  methods: {
    getContainer () {
      return this.$refs.splitPane
    },

    normalizeWidth () {
      const nodes = [...this.$refs.splitPane.childNodes]
      const totalWidths = nodes.map(item => item.getBoundingClientRect().width)
      const paneWidth = this.$refs.splitPane.getBoundingClientRect().width
      const restWidth = paneWidth - totalWidths.reduce((t, s) => t + s, 0)
      let instance

      nodes.forEach((node, i) => {
        instance = node.__drag__instance__
        let { width, minWidth, updateContentStyle } = instance
        updateContentStyle({
          width: Math.max(width || 0, minWidth || 0, totalWidths[i]) + 'px'
        })
      })

      if (restWidth > 0) {
        updateContentStyle({
          width: totalWidths[totalWidths.length - 1] + restWidth + 'px'
        })
      }

      this.currentPaneWidth = paneWidth
      this.normaled = true
    },

    observeResize () {
      this.observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === this.$refs.splitPane) {
            const { width, height } = entry.contentRect
            if (width !== this.currentPaneWidth) {
              this.handleResize(width)
            }
          }
        }
      })

      // 开始观察
      this.observer.observe(this.$refs.splitPane)
    },

    handleResize (newWidth) {
      this.$nextTick(() => {
        // this.normalizeWidth()
      })
    },

    async handleCollapse (pane, collapse) {
      const nodes = [...this.$refs.splitPane.childNodes]
      const paneWidth = !collapse ? this.collapseWidth.get(pane) : pane.getBoundingClientRect().width
      let instance
      const tWidth = this.$refs.splitPane.getBoundingClientRect().width - (collapse ? paneWidth : 0)

      // 收起
      if (collapse) {
        nodes.forEach((node, i) => {
          instance = node.__drag__instance__
          if (node === pane) {
            this.collapseWidth.set(pane, paneWidth)
            instance.updateContentStyle({
              width: '0px',
              overflow: 'hidden'
            })
            return
          }

          let cwith = node.getBoundingClientRect().width
          let newWidth = cwith + paneWidth * (cwith / tWidth)

          instance.updateContentStyle({
            width: newWidth + 'px'
          })
        })
      } else {
        let restMinu = 0

        // 展开
        nodes.forEach((node) => {
          instance = node.__drag__instance__

          if (node === pane) {
            let width = this.collapseWidth.get(pane)
            this.collapseWidth.delete(pane)
            instance.updateContentStyle({
              width: width + 'px'
            })
            return
          }

          let minWidth = instance.minWidth || 0
          let cwith = node.getBoundingClientRect().width
          let newWidth = cwith - paneWidth * (cwith / tWidth) - restMinu

          if (newWidth < minWidth) {
            restMinu = minWidth - newWidth
            newWidth = minWidth
          } else {
            restMinu = 0
          }

          instance.updateContentStyle({
            width: (newWidth).toFixed(2) + 'px'
          })
        })

        await this.$nextTick()

        if (restMinu > 1) {
          nodes.forEach((node) => {
            instance = node.__drag__instance__

            if (node === pane || !restMinu) {
              return
            }

            let minWidth = instance.minWidth || 0
            let cwith = node.getBoundingClientRect().width
            let newWidth = cwith - restMinu

            if (newWidth < minWidth) {
              restMinu = minWidth - newWidth
              newWidth = minWidth
            } else {
              restMinu = 0
            }

            instance.updateContentStyle({
              width: (newWidth).toFixed(2) + 'px'
            })

          })
        }

      }
    }
  },

  beforeDestroy () {
    this.observe && this.observer.disconnect()
  }
}
</script>

<style lang="scss" scoped>
.split-pane {
  display: flex;
  background: var(--split-pane-base-background, #fff);
  height: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  white-space: nowrap;
  position: relative;

  &--normaled {
    display: block;
  }
}
</style>