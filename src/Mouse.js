import {Delta} from './Delta'

const MOUSE_DOWN = 'mousedown'
const MOUSE_MOVE = 'mousemove'
const MOUSE_UP = 'mouseup'

export class Mouse extends Delta {
  constructor (target, event = MOUSE_MOVE) {
    super(target, event)
  }

  static start (target, event = MOUSE_DOWN) {
    return super.start(target, event)
  }

  static stop (target, event = MOUSE_UP) {
    return super.stop(target, event)
  }
}

export default Mouse
