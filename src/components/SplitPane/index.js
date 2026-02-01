
import SplitPane from './SplitPane.vue'
import SplitPaneContent from './SplitPaneContent.vue'

export default function (Vue) {
  Vue.component('SplitPane', SplitPane)
  Vue.component('SplitPaneContent', SplitPaneContent)
}

export {
  SplitPane,
  SplitPaneContent
}