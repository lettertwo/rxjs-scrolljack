import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {fromEvent} from 'rxjs/observable/fromEvent'
import {_do as tap} from 'rxjs/operator/do'
import {preventDefault} from '../utils'

class FromHijackedEventObserverable extends Observable {
  constructor (target, ...args) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromEvent(target, ...args)::tap(preventDefault)
    }
  }

  lift (operator) {
    const observable = new FromHijackedEventObserverable(this)
    observable.operator = operator
    return observable
  }

  static create (...args) {
    return new FromHijackedEventObserverable(...args)
  }
}

export const fromHijackedEvent = FromHijackedEventObserverable.create
