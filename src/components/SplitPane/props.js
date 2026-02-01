
export const splitPaneProps = {
  
}

export const splitPaneContentProps = {
  paneId: {
    type: String,
    required: true
  },

  collapse: {
    type: Boolean,
    default: false
  },

  fullscreen: {
    type: Boolean,
    default: false
  },

  width: {
    type: Number,
    required: false
  },

  minWidth: {
    type: Number,
    default: 0
  },

  draggable: {
    type: Boolean,
    default: false
  },

  draggerPosition: {
    type: String,
    default: ''
  }
}