import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {share} from 'rxjs/operator/share'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {filter} from 'rxjs/operator/filter'
import {HijackableEventObservable} from './HijackableEventObservable'
import {KeyboardEventEmulatorOperator} from '../operators/KeyboardEventEmulatorOperator'
import {KEY_UP, KEY_DOWN} from '../events'

const keyDownTargets = new WeakMap()

const getKeyDownEventSource = target => {
  if (!keyDownTargets.has(target)) {
    keyDownTargets.set(target, merge(
        HijackableEventObservable.create(target, KEY_DOWN),
        HijackableEventObservable.create(target, KEY_UP),
      )
      .lift(new KeyboardEventEmulatorOperator())
      ::share()
    )
  }
  return keyDownTargets.get(target)
}

export class EmulatedKeyboardEventObservable extends Observable {
  constructor (target, event, predicate) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = getKeyDownEventSource(target)
        ::filter(({type}) => type === event)

      if (predicate) {
        this.source = this.source::filter(predicate)
      }
    }
  }

  lift (operator) {
    const observable = new EmulatedKeyboardEventObservable(this)
    observable.operator = operator
    return observable
  }

  static create (...args) {
    return new EmulatedKeyboardEventObservable(...args)
  }
}

export default EmulatedKeyboardEventObservable
