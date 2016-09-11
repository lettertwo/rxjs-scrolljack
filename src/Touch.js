import {Delta} from './Delta'

const TOUCH_START = 'touchstart'
const TOUCH_MOVE = 'touchmove'
const TOUCH_END = 'touchend'

const excludeMultiTouch = e => e.touches.length <= 1

export class Touch extends Delta {
  constructor (target, event = TOUCH_MOVE) {
    super(target, event, excludeMultiTouch)
  }

  static start (target, event = TOUCH_START) {
    return super.start(target, event)
  }

  static stop (target, event = TOUCH_END) {
    return super.stop(target, event)
  }
}

export default Touch
