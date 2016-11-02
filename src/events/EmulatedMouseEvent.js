import {EmulatedUIEvent} from './EmulatedUIEvent'

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

export default EmulatedMouseEvent
