<template>
  <editor-container
    :collapseSlider="collapseSlider"
    :fullscreenPreivew="fullscreenPreivew"
  >
    <template #slider>
      <div class="index-slider">
        <div class="index-slider-top">
          <div class="my-index">我的指数</div>
          <button>添加指数</button>
        </div>
        <div class="draggable-list">
          <transition-group name="drag-list">
            <div
              v-for="(item) in list"
              :key="item.id"
              :data-id="item.id"
              class="drag-item"
              :class="{ 'is-dragging': isDragging, 'is-hover': hoveredId === item.id }"
              draggable="true"
              @dragstart="handleDragstart"
              @dragenter="handleDragenter"
              @dragover="handleDragover"
              @dragleave="handleDragleave"
              @drop="handleDrop"
              @dragend="handleDragend"
              @mouseenter="handleMouseenter"
              @mouseleave="handleMouseleave"
            >
              <div>
                <div>{{ item.title }}</div>
                <div>{{ item.label }}</div>
              </div>

              <button
                class="item-more"
                draggable="false"
                @dragstart="handleDrapMore"
                @mousedown.stop="handleDrapMore"
                @click="handleClickMore"
              >...</button>
            </div>
          </transition-group>
        </div>
      </div>
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
import Draggable from 'vuedraggable'

export default {
  name: 'IndexEditor',

  components: {
    EditorContainer,
    Draggable
  },

  data () {
    return {
      collapseSlider: false,
      fullscreenPreivew: false,
      list: [
        { id: '1', title: '1-深沪sanbia', label: '23423' },
        { id: '2', title: '2-深沪sanbia', label: '23423' },
        { id: '3', title: '3-深沪sanbia', label: '23423' },
        { id: '4', title: '4-深沪sanbia', label: '23423' },
      ],
      isDragging: false, // 拖拽状态标志
      hoveredId: null, // 当前鼠标悬停的元素 id
      currentDragstart: null,
      dragEnterCount: {}, // 用于跟踪每个元素的 dragenter 次数
      draggedItem: null, // 保存被拖拽的元素数据
      draggedId: null, // 保存被拖拽的元素 id
      dropTargetId: null // 保存 drop 目标元素的 id
    }
  },

  methods: {
    handleDragstart (e) {
      this.isDragging = true
      this.currentDragstart = e.currentTarget
      this.currentDragstart.style.opacity = '1'
      this.currentDragstart.style.background = '#ccc'

      // 保存被拖拽的元素数据
      const id = e.currentTarget.dataset.id
      const item = this.list.find(i => i.id === id)
      this.draggedItem = { ...item }
      this.draggedId = item.id

      // 计算鼠标在元素内的偏移量
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      // 创建自定义 ghost 元素
      const ghost = e.currentTarget.cloneNode(true)
      ghost.style.position = 'absolute'
      ghost.style.top = '-9999px'
      ghost.style.left = '-9999px'
      ghost.style.width = e.currentTarget.offsetWidth + 'px'
      ghost.style.height = e.currentTarget.offsetHeight + 'px'
      ghost.style.background = 'skyblue'
      ghost.style.border = '2px solid blue'
      ghost.style.opacity = '1'
      ghost.style.pointerEvents = 'none'
      ghost.style.margin = '0'
      ghost.style.padding = '0'
      ghost.style.display = 'flex'
      ghost.style.justifyContent = 'space-between'
      ghost.style.alignItems = 'center'
      document.body.appendChild(ghost)

      // 设置拖拽数据
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify(this.draggedItem))

      // 设置自定义拖拽图像，使用偏移量让鼠标位置保持一致
      e.dataTransfer.setDragImage(ghost, offsetX, offsetY)

      // 清理 ghost 元素
      setTimeout(() => {
        document.body.removeChild(ghost)
      }, 0)
    },

    handleDragenter (e) {
      if (e.currentTarget === this.currentDragstart) {
        return
      }

      e.preventDefault()

      // 使用 id 作为 key
      const id = e.currentTarget.dataset.id
      this.dragEnterCount[id] = (this.dragEnterCount[id] || 0) + 1

      // 只有第一次进入时才设置样式
      if (this.dragEnterCount[id] === 1) {
        e.currentTarget.classList.add('drag-over')
      }
    },

    handleDragover (e) {
      e.preventDefault()
      if (e.currentTarget === this.currentDragstart) {
        return
      }
      e.currentTarget.classList.add('drag-over')
    },

    handleDragleave (e) {
      if (e.currentTarget === this.currentDragstart) {
        return
      }

      e.preventDefault()

      // 使用 id 作为 key
      const id = e.currentTarget.dataset.id
      this.dragEnterCount[id] = (this.dragEnterCount[id] || 0) - 1

      // 只有计数器归零时才清除样式（真正离开元素）
      if (this.dragEnterCount[id] === 0) {
        e.currentTarget.classList.remove('drag-over')
      }
    },

    handleClickMore () {
      console.log('more')
    },

    handleDrop (e) {
      if (e.currentTarget === this.currentDragstart) {
        return
      }

      e.preventDefault()

      // 重置计数器
      const targetId = e.currentTarget.dataset.id
      this.dragEnterCount[targetId] = 0

      // 插入元素到新位置
      this.insertItem(this.draggedItem, this.draggedId, targetId)

      // 清理样式
      e.currentTarget.classList.remove('drag-over')

      // 保存被拖拽元素的 id（拖拽后就是这个元素在 hover 状态）
    },

    handleDrapMore (e) {
      e.preventDefault()
    },

    handleDragend (e) {
      // 清理拖拽元素的状态
      if (this.currentDragstart) {
        this.currentDragstart.style.opacity = '1'
        this.currentDragstart.style.background = null
        this.currentDragstart.classList.remove('drag-over')
      }

      this.hoveredId = null

      // 强制清除所有元素的 hover 样式
      this.$nextTick(() => {
        const items = this.$el.querySelectorAll('.drag-item')
        items.forEach(item => {
          item.classList.remove('drag-over')
          item.style.background = ''
        })

        // 监听被拖拽元素的过渡结束事件
        if (this.currentDragstart) {
          const handleTransitionEnd = () => {
            // 设置 hoveredId 为拖拽后的元素（dropTargetId）
            this.isDragging = false

            if (!this.hoveredId) {
              this.hoveredId = this.draggedId
            }
            this.currentDragstart.removeEventListener('transitionend', handleTransitionEnd)
            this.currentDragstart = null
          }
          this.currentDragstart.addEventListener('transitionend', handleTransitionEnd)
        }

        // 重置拖拽状态
        this.draggedItem = null
        this.dragEnterCount = {}
      })
    },

    handleMouseenter (e) {
      // 如果正在拖拽，不触发 hover 效果
      if (this.isDragging) {
        return
      }
      const id = e.currentTarget.dataset.id
      this.hoveredId = id
    },

    handleMouseleave (e) {
      this.hoveredId = null
    },

    insertItem(item, fromId, toId) {
      // 如果目标 id 相同，不执行插入
      if (fromId === toId) {
        return
      }

      // 找到源索引和目标索引
      const fromIndex = this.list.findIndex(i => i.id === fromId)
      const toIndex = this.list.findIndex(i => i.id === toId)

      // 如果索引无效，不执行插入
      if (fromIndex === -1 || toIndex === -1) {
        return
      }

      // 从原位置移除元素
      const newList = [...this.list]
      const [removed] = newList.splice(fromIndex, 1)

      // 插入到新位置
      // 如果目标索引在原索引之后，需要调整插入位置
      const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
      newList.splice(adjustedToIndex, 0, removed)

      // 更新列表
      this.list = newList
    }
  }
}
</script>

<style lang="scss" scoped>
.index-slider {
  background: #eee;

  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.index-slider-top {
  flex-shrink: 0;
  margin-bottom: 32px;
}

.my-index {
  padding: 32px;
  font-size: 28px;
}

.draggable-list {
  flex: 1;
}

.drag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;

  .item-more {
    display: none;
    padding: 5px 20px;
    cursor: pointer;
    user-select: none;

    &:hover {
      background: #ccc;
    }
  }

  &:not(.is-dragging).is-hover {
    background: skyblue;
    .item-more {
      display: block;
    }
  }

  &.drag-over::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: blue;
  }
}

/* 列表过渡效果 */
.drag-list-enter-active,
.drag-list-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.drag-list-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.drag-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 列表移动过渡效果 */
.drag-list-move {
  transition: transform 0.3s ease;
}
</style>