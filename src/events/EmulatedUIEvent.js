import {EmulatedEvent} from './EmulatedEvent'

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

export default EmulatedUIEvent
