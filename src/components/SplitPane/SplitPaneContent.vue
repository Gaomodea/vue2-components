<template>
  <div 
    ref="pane"
    class="split-pane-content" :class="fullScreenClasses" :style="contentStyle">

    <div class="split-pane-content__body" >
      <slot></slot>
    </div>

    <div 
      v-if="draggable"
      v-show="!fullscreen"
      ref="dragger"
      class="split-pane-dragger"
      :class="splitDraggerClasses"
    ></div>
  </div>
</template>

<script>
import { splitPaneContentProps } from './props'

export default {
  name: 'SplitPaneContent',

  props: splitPaneContentProps,

  inject: [
    'registryPaneContent', 
    'unregistryPaneContent',
    'handleCollapse'
  ],

  data () {
    return {
      innerCollapse: false,
      style: null
    }
  },

  mounted () {
    // 所有面板都需要注册，以便获取其 minWidth 信息
    this.registryPaneContent(this, this.$refs.pane, this.draggable ? this.$refs.dragger : null)

    this.unwatchCollapse= this.$watch('collapse', () => {
      let changed = this.innerCollapse != this.collapse
      this.innerCollapse = this.collapse
      if (changed) {
        this.$nextTick(() => {
          this.handleCollapse(this.$refs.pane, this.collapse)
        })
      }
    }, {
      immediate: true
    })
  },
  
  beforeDestroy () {
    this.unwatchCollapse?.()
    this.unregistryPaneContent(this)
  },

  computed: {
    splitDraggerClasses () {
      const { draggerPosition } = this

      // 默认 right 0
      if (!draggerPosition) {
        return
      }

      return `split-pane-dragger--${draggerPosition}`
    },

    contentStyle () {
      const { width, minWidth, innerCollapse, style } = this

      if (innerCollapse) {
        return {
          ...this.style,
          overflow: 'hidden'
        }
      }

      if (style) {
        return style
      }

      return {
        width: width ? width + 'px' : null,
        flex: width ? null : 1,
        flexBasis: width || minWidth ? Math.max(width || 0, minWidth || 0) + 'px' : null
      }
    },

    fullScreenClasses () {
      return {
        'split-pane-content--fullscreen': this.fullscreen
      }
    }
  },

  methods: {
    /**
     * dragMixin中调用
     * @param width 
     */
    handleUpdateDraggedWidth (width) {
      this.style = {
        ...this.style,
        width: width + 'px'
      }
    },

    /**
     * splitPane中调用调用
     * @param style 
     */
    updateContentStyle(style) {
      this.style = style
    }
  }
}
</script>

<style lang="scss" scoped>
.split-pane-content {
  display: inline-flex;
  position: relative;
  height: 100%;
  white-space: initial;
  vertical-align: top;

  &__body {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;

    > :first-of-type:last-of-type {
      flex: 1;
    }
  }

  &--fullscreen {
    position: static;
    .split-pane-content__body {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: var(--split-pane-full-screen-z-index, 99);
      background: var(--split-pane-base-background, #fff);
    }
  }

  .split-pane-dragger {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 11px;
    opacity: 0;
    right: 0;
    box-sizing: border-box;
    transform: translateX(50%);
    cursor: ew-resize;
    z-index: 19;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 3px;
      left: 50%;
      transform: translateX(-50%);
      background: blue;
    }
  }

  &:last-of-type .split-pane-dragger,
  .split-pane-dragger--left {
    right: unset;
    left: 0;
    transform: translateX(-50%);
  }

  &:first-of-type:last-of-type {
    .split-pane-dragger {
      display: none;
    }
  }

}
</style>