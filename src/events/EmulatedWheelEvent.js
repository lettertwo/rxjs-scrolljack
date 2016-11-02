import {EmulatedMouseEvent} from './EmulatedMouseEvent'

export class EmulatedWheelEvent extends EmulatedMouseEvent {
  static Interface = {
    ...EmulatedMouseEvent.Interface,
    deltaX: null,
    deltaY: null,
    deltaZ: null,
    deltaMode: null,
  }
}

export default EmulatedWheelEvent
