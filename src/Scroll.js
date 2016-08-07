import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {Touch} from './Touch'
import {Wheel} from './Wheel'
import {Keyboard} from './Keyboard'

export class Scroll extends Observable {

  constructor (target, ...sources) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.sources = [target[$$observable](), ...sources]
    } else {
      super()
      this.sources = [
        Wheel.from(target),
        Touch.from(target),
        Keyboard.from(target),
        ...sources,
      ]
    }
    this.source = merge(...this.sources)
  }

  lift (operator) {
    const observable = new Scroll(this)
    observable.operator = operator
    return observable
  }

  static from (...args) {
    return new Scroll(...args)
  }

  static start (target, ...sources) {
    return new Scroll(
      Wheel.start(target),
      Touch.start(target),
      Keyboard.start(target),
      ...sources,
    )
  }

  static move (target, ...sources) {
    return new Scroll(
      Wheel.move(target),
      Touch.move(target),
      Keyboard.move(target),
      ...sources,
    )
  }

  static stop (target, ...sources) {
    return new Scroll(
      Wheel.stop(target),
      Touch.stop(target),
      Keyboard.stop(target),
      ...sources,
    )
  }
}

export default Scroll
