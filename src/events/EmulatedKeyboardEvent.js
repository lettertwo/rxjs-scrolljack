import {EmulatedUIEvent} from './EmulatedUIEvent'

export class EmulatedKeyboardEvent extends EmulatedUIEvent {
  static Interface = {
    ...EmulatedUIEvent.Interface,
    key: null,
    location: null,
    ctrlKey: null,
    shiftKey: null,
    altKey: null,
    metaKey: null,
    repeat: null,
    locale: null,
    keyCode: null,
    code: null,
    which: null,
  }

  getModifierState (key) {
    return this.nativeEvent.getModifierState(key)
  }
}

export default EmulatedKeyboardEvent
