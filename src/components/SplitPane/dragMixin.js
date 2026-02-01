
/**
 * 拖拽器显示延迟（毫秒）
 */
const DRAGGER_SHOW_DELAY = 300

/**
 * 文本选择控制常量
 */
const USER_SELECT_NONE = 'none'
const USER_SELECT_AUTO = 'auto'

/**
 * 拖拽器事件类型
 */
const DRAG_EVENT_TYPES = {
  mouseenter: 'mouseenter',
  mouseleave: 'mouseleave',
  mousedown: 'mousedown'
}

/**
 * 文档事件类型
 */
const DOCUMENT_EVENT_TYPES = {
  mousemove: 'mousemove',
  mouseup: 'mouseup'
}

/**
 * 创建拖拽混入
 *
 * @returns {Object} Vue 混入对象
 */
export const createDragMixin = () => {
  // 存储所有注册的面板实例：Map<instance, { pane, dragger }>
  const context = new Map()
  // 保存拖拽前的文本选择范围，拖拽结束后恢复
  let savedSelection = null

  return {
    data() {
      return {
        mousein: false,   // 鼠标是否在拖拽器上
        dragging: false   // 是否正在拖拽
      }
    },

    methods: {
      /**
       * 注册 SplitPaneContent 面板
       *
       * @param {Object} instance - SplitPaneContent 组件实例
       * @param {HTMLElement} pane - 面板 DOM 元素
       * @param {HTMLElement|null} dragger - 拖拽器 DOM 元素（如果面板可拖拽）
       */
      registryPaneContent(instance, pane, dragger) {
        const draggerPosition = dragger ? getDraggerPosition(dragger) : null

        // 在面板元素上存储引用，便于快速访问
        pane.__drag__instance__ = instance

        if (dragger) {
          // 在拖拽器上存储引用
          dragger.__drag__position__ = draggerPosition
          dragger.__drag__instance__ = instance
          dragger.__drag__pane__ = pane
        }

        // 将实例和其关联的 DOM 元素存储到 context 中
        context.set(instance, { pane, dragger })
      },

      /**
       * 注销 SplitPaneContent 面板
       *
       * @param {Object} instance - SplitPaneContent 组件实例
       */
      unregistryPaneContent(instance) {
        const ctx = context.get(instance)
        if (!ctx) return

        // 清除面板上的引用
        ctx.pane.__drag__instance__ = null

        if (ctx.dragger) {
          // 移除拖拽器事件监听
          removeDraggerEvents(ctx.dragger, this)
          // 清除拖拽器上的引用
          clearDraggerData(ctx.dragger)
        }

        // 从 context 中移除实例
        context.delete(instance)
      },

      /**
       * 鼠标进入拖拽器时的事件处理
       *
       * @param {MouseEvent} e - 鼠标事件对象
       */
      handleMouseenter(e) {
        // 如果有当前拖拽器且不是目标元素，直接返回
        if (this.dragger && e.target !== this.dragger) return

        this.dragger = e.target
        this.mousein = true

        // 如果正在拖拽，不显示/隐藏拖拽器
        if (this.dragging) return

        // 延迟显示拖拽器
        this.scheduleDraggerShow(e.target)
      },

      /**
       * 鼠标离开拖拽器时的事件处理
       *
       * @param {MouseEvent} e - 鼠标事件对象
       */
      handleMouseleave(e) {
        if (this.dragger && e.target !== this.dragger) return

        this.mousein = false

        if (this.dragging) return

        // 取消显示定时器并隐藏拖拽器
        this.cancelDraggerTimer()
        setDraggerOpacity(e.target, null)
        this.dragger = null
      },

      /**
       * 鼠标按下时的事件处理
       *
       * @param {MouseEvent} e - 鼠标事件对象
       */
      handleMousedown(e) {
        if (this.dragger && e.target !== this.dragger) return
        this.initDragStart(e)
      },

      /**
       * 鼠标移动时的事件处理（拖拽过程中）
       *
       * @param {MouseEvent} e - 鼠标事件对象
       */
      handleMousemove(e) {
        if (!this.dragging) return

        // 计算新的宽度并更新面板
        const newWidth = this.calculateNewWidth(e)
        this.handleUpdateDraggedWidth(newWidth)

        const sibling = this.getDragSibling()
        sibling.__drag__instance__.handleUpdateDraggedWidth(this.totalDragWidth - newWidth)
      },

      /**
       * 鼠标松开时的事件处理
       *
       * @param {MouseEvent} e - 鼠标事件对象
       */
      handleMouseup(e) {
        // if (this.dragger && e.target !== this.dragger) return
        if (!this.dragging) return

        this.dragging = false
        this.resetDrag()

        // 如果鼠标不在拖拽器上，隐藏拖拽器
        if (!this.mousein) {
          setDraggerOpacity(this.dragger, 0)
          this.dragger = null
        }
      },

      /**
       * 初始化拖拽状态
       *
       * @param {MouseEvent} e - 鼠标事件对象
       */
      initDragStart(e) {
        const pane = e.target.__drag__pane__
        const instance = e.target.__drag__instance__
        const draggerPosition = e.target.__drag__position__
        const { minWidth, handleUpdateDraggedWidth } = instance

        // 保存拖拽前的文本选择
        this.saveSelection()
        // 初始化拖拽状态数据
        this.initializeDragState(instance, pane, e, minWidth, handleUpdateDraggedWidth, draggerPosition)
        // 设置拖拽环境（禁用文本选择、显示拖拽器）
        this.setupDragEnvironment(e.target)
      },

      /**
       * 重置拖拽状态
       */
      resetDrag() {
        this.clearDragState()
        this.restoreSelection()
        this.cleanupDragEnvironment()
      },

      /**
       * 计算剩余可用宽度
       *
       * 计算除了当前拖拽面板外的所有面板的宽度总和，
       * 其中相邻面板使用其 minWidth，其他面板使用当前宽度。
       * 这样可以防止拖拽时将相邻面板压缩到低于其 minWidth。
       *
       * @returns {number} 剩余可用宽度
       */
      getRestWidth() {
        // 获取拖拽器相邻的面板元素
        const sibling = this.getDragSibling()
        // 获取所有同级面板元素
        const siblings = Array.from(this.currentPane.parentNode.children)

        let restWidth = 0

        for (const node of siblings) {
          // 跳过当前拖拽的面板
          if (node === this.currentPane) continue

          if (node === sibling) {
            // 相邻面板使用 minWidth
            const siblingInstance = node.__drag__instance__
            restWidth += (siblingInstance?.minWidth || 0)
          } else {
            // 其他面板使用当前宽度
            restWidth += node.getBoundingClientRect().width
          }
        }

        return restWidth
      },

      /**
       * 保存当前的文本选择范围
       */
      saveSelection() {
        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          savedSelection = selection.getRangeAt(0)
        }
      },

      /**
       * 恢复之前保存的文本选择范围
       */
      restoreSelection() {
        if (savedSelection) {
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(savedSelection)
          savedSelection = null
        }
      },

      /**
       * 初始化拖拽状态数据
       *
       * @param {Object} instance - SplitPaneContent 组件实例
       * @param {HTMLElement} pane - 面板 DOM 元素
       * @param {MouseEvent} e - 鼠标事件对象
       * @param {number} minWidth - 面板最小宽度
       * @param {Function} handleUpdateDraggedWidth - 更新拖拽宽度的回调函数
       * @param {string} draggerPosition - 拖拽器位置（'left' 或 'right'）
       */
      initializeDragState(instance, pane, e, minWidth, handleUpdateDraggedWidth, draggerPosition) {
        this.dragging = true
        this.startX = e.clientX
        this.dragMinWidth = minWidth
        this.draggerPosition = draggerPosition
        this.handleUpdateDraggedWidth = handleUpdateDraggedWidth
        this.startWidth = pane.getBoundingClientRect().width
        this.containerRect = this.getContainer().getBoundingClientRect()
        this.currentPane = pane
        this.currentInstance = instance

        const sibling = this.getDragSibling()
        this.totalDragWidth = sibling.getBoundingClientRect().width + pane.getBoundingClientRect().width
        this.maxDragWidth = this.totalDragWidth - (sibling.__drag__instance__.minWidth || 0)
      },

      /**
       * 清除拖拽状态数据
       */
      clearDragState() {
        this.dragMinWidth = null
        this.handleUpdateDraggedWidth = null
        this.startX = null
        this.startWidth = null
        this.containerRect = null
        this.dragInstance = null
        this.draggerPosition = null
        this.currentPane = null
        this.currentInstance = null
        this.totalDragWidth = null
      },

      /**
       * 获取拖拽器相邻的面板元素
       *
       * @returns {HTMLElement} 相邻面板元素
       */
      getDragSibling() {
        return this.draggerPosition === 'left'
          ? this.currentPane.previousElementSibling  // 拖拽器在左侧，相邻面板是前一个
          : this.currentPane.nextElementSibling      // 拖拽器在右侧，相邻面板是后一个
      },

      /**
       * 计算新的面板宽度
       *
       * @param {MouseEvent} e - 鼠标事件对象
       * @returns {number} 计算后的新宽度
       */
      calculateNewWidth(e) {
        const { dragMinWidth } = this
        // 根据拖拽器位置确定拖拽方向
        const direction = this.draggerPosition === 'left' ? -1 : 1
        const movedWidth = (e.clientX - this.startX) * direction
        const newWidth = this.startWidth + movedWidth
        // 最大宽度不能超过容器宽度减去其他面板占用的宽度
        return Math.max(dragMinWidth, Math.min(newWidth, this.maxDragWidth))
      },

      /**
       * 安排延迟显示拖拽器
       *
       * @param {HTMLElement} target - 拖拽器元素
       */
      scheduleDraggerShow(target) {
        this.cancelDraggerTimer()
        this.draggerTimer = setTimeout(() => {
          setDraggerOpacity(target, 1)
        }, DRAGGER_SHOW_DELAY)
      },

      /**
       * 取消拖拽器显示定时器
       */
      cancelDraggerTimer() {
        clearTimeout(this.draggerTimer)
      },

      /**
       * 设置拖拽环境
       *
       * @param {HTMLElement} target - 拖拽器元素
       */
      setupDragEnvironment(target) {
        // 禁用文本选择，防止拖拽时意外选择文本
        document.body.style.userSelect = USER_SELECT_NONE
        this.cancelDraggerTimer()
        // 立即显示拖拽器
        setDraggerOpacity(target, 1)
      },

      /**
       * 清理拖拽环境
       */
      cleanupDragEnvironment() {
        // 恢复文本选择
        document.body.style.userSelect = USER_SELECT_AUTO
        this.cancelDraggerTimer()
      }
    },

    mounted() {
      // 添加文档级事件监听（用于拖拽过程中）
      addDocumentEventListeners(this)
      // 为所有已注册的拖拽器添加事件监听
      registerAllDraggers(this)
    },

    beforeDestroy() {
      // 移除文档级事件监听
      removeDocumentEventListeners(this)
      // 注销所有面板
      unregisterAllPanes(this)
    }
  }

  /**
   * 获取拖拽器位置
   *
   * @param {HTMLElement} dragger - 拖拽器元素
   * @returns {string} 'left' 或 'right'
   */
  function getDraggerPosition(dragger) {
    return parseInt(window.getComputedStyle(dragger).left) < 1 ? 'left' : 'right'
  }

  /**
   * 清除拖拽器数据
   *
   * @param {HTMLElement} dragger - 拖拽器元素
   */
  function clearDraggerData(dragger) {
    dragger.__drag__instance__ = null
    dragger.__drag__pane__ = null
    dragger.__drag__position__ = null
  }

  /**
   * 设置拖拽器透明度
   *
   * @param {HTMLElement} target - 拖拽器元素
   * @param {number|null} opacity - 透明度值
   */
  function setDraggerOpacity(target, opacity) {
    target.style.opacity = opacity
  }

  /**
   * 添加文档级事件监听
   *
   * @param {Object} vm - Vue 组件实例
   */
  function addDocumentEventListeners(vm) {
    document.addEventListener(DOCUMENT_EVENT_TYPES.mousemove, vm.handleMousemove)
    document.addEventListener(DOCUMENT_EVENT_TYPES.mouseup, vm.handleMouseup)
  }

  /**
   * 移除文档级事件监听
   *
   * @param {Object} vm - Vue 组件实例
   */
  function removeDocumentEventListeners(vm) {
    document.removeEventListener(DOCUMENT_EVENT_TYPES.mousemove, vm.handleMousemove)
    document.removeEventListener(DOCUMENT_EVENT_TYPES.mouseup, vm.handleMouseup)
  }

  /**
   * 添加拖拽器事件监听
   *
   * @param {HTMLElement} dragger - 拖拽器元素
   * @param {Object} vm - Vue 组件实例
   */
  function addDraggerEvents(dragger, vm) {
    dragger.addEventListener(DRAG_EVENT_TYPES.mouseenter, vm.handleMouseenter)
    dragger.addEventListener(DRAG_EVENT_TYPES.mouseleave, vm.handleMouseleave)
    dragger.addEventListener(DRAG_EVENT_TYPES.mousedown, vm.handleMousedown)
  }

  /**
   * 移除拖拽器事件监听
   *
   * @param {HTMLElement} dragger - 拖拽器元素
   * @param {Object} vm - Vue 组件实例
   */
  function removeDraggerEvents(dragger, vm) {
    dragger.removeEventListener(DRAG_EVENT_TYPES.mouseenter, vm.handleMouseenter)
    dragger.removeEventListener(DRAG_EVENT_TYPES.mouseleave, vm.handleMouseleave)
    dragger.removeEventListener(DRAG_EVENT_TYPES.mousedown, vm.handleMousedown)
  }

  /**
   * 注册所有拖拽器
   */
  function registerAllDraggers(vm) {
    for (const ctx of context.values()) {
      if (ctx.dragger) {
        addDraggerEvents(ctx.dragger, vm)
      }
    }
  }

  /**
   * 注销所有面板
   */
  function unregisterAllPanes(vm) {
    for (const instance of context.keys()) {
      vm.unregistryPaneContent(instance)
    }
  }
}