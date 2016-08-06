import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {WheelSubscriber} from './WheelSubscriber'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'

const WHEEL = 'wheel'

export class Wheel extends Observable {
  constructor (target) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromHijackedEvent(target, WHEEL)
      this.source.operator = new DeltaOperator()
    }
  }

  lift (operator) {
    const observable = new this.constructor(this)
    observable.operator = operator
    return observable
  }

  static from (target) {
    return new Wheel(target)
  }

  static start (target) {
    return new Wheel(target).lift(new WheelStartOperator())
  }

  static move (target) {
    return new Wheel(target).lift(new WheelMoveOperator())
  }

  static stop (target) {
    return new Wheel(target).lift(new WheelStopOperator())
  }
}

export default Wheel

class WheelStartOperator {
  call (subscriber, source) {
    return source._subscribe(new WheelStartSubscriber(subscriber))
  }
}

class WheelStartSubscriber extends WheelSubscriber {
  _start (value) {
    this.dispatch(value)
  }
}

class WheelMoveOperator {
  call (subscriber, source) {
    return source._subscribe(new WheelMoveSubscriber(subscriber))
  }
}

class WheelMoveSubscriber extends WheelSubscriber {
  _move (value) {
    this.dispatch(value)
  }
}

class WheelStopOperator {
  call (subscriber, source) {
    return source._subscribe(new WheelStopSubscriber(subscriber))
  }
}

class WheelStopSubscriber extends WheelSubscriber {
  _stop (value) {
    this.dispatch(value)
  }
}
