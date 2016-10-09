/* global KeyboardEvent */
import {Subscriber} from 'rxjs/Subscriber'
import {supportsNewEvent} from '../utils'
import {KEY_START, KEY_MOVE, KEY_END, KEY_DOWN} from '../events'

export class KeyboardEventEmulatorOperator {
  call (subscriber, source) {
    return source._subscribe(
      new KeyboardEventEmulatorSubcriber(subscriber)
    )
  }
}

export default KeyboardEventEmulatorOperator

class KeyboardEventEmulatorSubcriber extends Subscriber {
  constructor (destination) {
    super(destination)
    this._started = false
    this._lastValue
  }

  _next (value) {
    if (!this._started && value.type === KEY_DOWN) {
      this._lastValue = value
      this.startNow()
      this.moveNow()
    } else if (this.isRepeat(value)) {
      this._lastValue = value
      this.moveNow()
    } else {
      this.stopNow()

      if (value.type === KEY_DOWN) {
        this._lastValue = value
        this.startNow()
      }
    }
  }

  _complete () {
    super._complete()
    this._started = false
    this._lastValue = null
  }

  isRepeat (value) {
    const isit = (
      value &&
      this._lastValue &&
      value.type === this._lastValue.type &&
      value.key === this._lastValue.key &&
      value.code === this._lastValue.code &&
      value.ctrlKey === this._lastValue.ctrlKey &&
      value.shiftKey === this._lastValue.shiftKey &&
      value.altKey === this._lastValue.altKey &&
      value.metaKey === this._lastValue.metaKey
    )
    return isit
  }

  startNow () {
    if (!this._started) {
      this._started = true
      this.dispatch(createKeyboardEventFrom(this._lastValue, KEY_START))
    }
  }

  moveNow () {
    this.dispatch(createKeyboardEventFrom(this._lastValue, KEY_MOVE))
  }

  stopNow () {
    if (this._started) {
      this._started = false
      this.dispatch(createKeyboardEventFrom(this._lastValue, KEY_END))
    }
  }

  dispatch (value) {
    super._next(value)
  }
}

export const createKeyboardEventFrom = (value, type) => {
  if (supportsNewEvent()) {
    return new KeyboardEvent(type, value)
  } else {
    return createOldKeyboardEventFrom(value, type)
  }
}

const modifierMap = {
  ctrlKey: 'Control',
  shiftKey: 'Shift',
  altKey: 'Alt',
  metaKey: 'Meta',
}

const createOldKeyboardEventFrom = (value, type) => {
  const {view, key, locale, repeat} = value
  const modifiersList = Object.keys(modifierMap).reduce(
    (acc, key) => value[key] ? [...acc, modifierMap[key]] : acc,
    [],
  )
  const initArgs = [view, key, locale, modifiersList, repeat]
  const event = document.createEvent('KeyboardEvent')
  event.initKeyboardEvent(type, true, true, ...initArgs)
  return event
}
