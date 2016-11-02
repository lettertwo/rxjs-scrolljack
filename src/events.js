// Touch Events
export const TOUCH_START = 'touchstart'
export const TOUCH_MOVE = 'touchmove'
export const TOUCH_END = 'touchend'
export const TOUCH_CANCEL = 'touchcancel'

// Mouse Events
export const MOUSE_DOWN = 'mousedown'
export const MOUSE_MOVE = 'mousemove'
export const MOUSE_UP = 'mouseup'
export const MOUSE_LEAVE = 'mouseleave'
export const CLICK = 'click'

// Keyboard Events
export const KEY_DOWN = 'keydown'
export const KEY_UP = 'keyup'

// Synthetic Keyboard Events
export const KEY_START = 'keystart'
export const KEY_MOVE = 'keymove'
export const KEY_END = 'keyend'

// Wheel Events
export const WHEEL = 'wheel'

// Synthetic Wheel Events
export const WHEEL_START = 'wheelstart'
export const WHEEL_MOVE = 'wheelmove'
export const WHEEL_END = 'wheelend'

const returnTrue = () => true
const returnFalse = () => false

export class EmulatedEvent {
  static Interface = {
    type: null,
    target: null,
    currentTarget: null,
    eventPhase: null,
    bubbles: null,
    cancelable: null,
    timeStamp: event => event.timeStamp || Date.now(),
    defaultPrevented: null,
    isTrusted: null,
  }

  constructor (event, type) {
    const Interface = this.constructor.Interface

    for (const propName in Interface) {
      if (!Interface.hasOwnProperty(propName)) continue
      var normalize = Interface[propName]
      if (normalize) {
        this[propName] = normalize(event)
      } else {
        this[propName] = event[propName]
      }
    }

    this.isDefaultPrevented = event.defaultPrevented ? returnTrue : returnFalse
    this.isPropagationStopped = returnFalse

    this.type = type
    this.nativeEvent = event
  }

  preventDefault () {
    this.defaultPrevented = true
    if (this.nativeEvent.preventDefault) this.nativeEvent.preventDefault()
    this.isDefaultPrevented = returnTrue
  }

  stopPropagation () {
    if (this.nativeEvent.stopPropagation) this.nativeEvent.stopPropagation()
    this.isPropagationStopped = returnTrue
  }
}

export class EmulatedUIEvent extends EmulatedEvent {
  static Interface = {
    ...EmulatedEvent.Interface,
    view (event) {
      if (event.view) return event.view
      const target = event.target || event.srcElement || window
      return target === target.window ? target : window
    },
    detail: event => event.detail || 0,
  }
}

export class EmulatedMouseEvent extends EmulatedUIEvent {
  static Interface = {
    ...EmulatedUIEvent.Interface,
    clientX: null,
    clientY: null,
    pageX: null,
    pageY: null,
    screenX: null,
    screenY: null,
    ctrlKey: null,
    shiftKey: null,
    altKey: null,
    metaKey: null,
    button: null,
    buttons: null,
    relatedTarget (event) {
      return event.relatedTarget || (
        event.fromElement === event.srcElement
          ? event.toElement
          : event.fromElement
      )
    },
  }

  getModifierState (key) {
    return this.nativeEvent.getModifierState(key)
  }
}

export class EmulatedWheelEvent extends EmulatedMouseEvent {
  static Interface = {
    ...EmulatedMouseEvent.Interface,
    deltaX: null,
    deltaY: null,
    deltaZ: null,
    deltaMode: null,
  }
}
