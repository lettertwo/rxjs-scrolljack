import {EmulatedUIEvent} from './EmulatedUIEvent'

export class EmulatedTouchEvent extends EmulatedUIEvent {
  static Interface = {
    ...EmulatedUIEvent.Interface,
    touches: null,
    targetTouches: null,
    changedTouches: null,
    altKey: null,
    metaKey: null,
    ctrlKey: null,
    shiftKey: null,
  }

  getModifierState (key) {
    return this.nativeEvent.getModifierState(key)
  }
}

export default EmulatedTouchEvent
