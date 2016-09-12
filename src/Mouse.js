import {Delta} from './Delta'

const MOUSE_DOWN = 'mousedown'
const MOUSE_MOVE = 'mousemove'
const MOUSE_UP = 'mouseup'

export class Mouse extends Delta {
  constructor (target) {
    super(target, MOUSE_MOVE)
  }

  static start (target) {
    return super.start(target, MOUSE_DOWN)
  }

  static stop (target) {
    return super.stop(target, MOUSE_UP)
  }
}

export default Mouse
