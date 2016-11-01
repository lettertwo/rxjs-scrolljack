import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {mapTo} from 'rxjs/operator/mapTo'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {DeltaGeneratorObservable} from './DeltaGeneratorObservable'
import {HijackableEventObservable} from './HijackableEventObservable'
import {DeltaOperator} from '../operators/DeltaOperator'
import {RectOperator} from '../operators/RectOperator'
import {MomentumOperator} from '../operators/MomentumOperator'
import {AnchorOperator} from '../operators/AnchorOperator'
import {AccumulationOperator} from '../operators/AccumulationOperator'
import {HijackOperator} from '../operators/HijackOperator'

const DEFAULT_VALUE = Object.freeze({
  deltaT: 0,
  deltaX: 0,
  deltaY: 0,
  velocityX: 0,
  velocityY: 0,
})

export class DeltaObservable extends Observable {
  constructor (target, event, predicate, computeDelta, computeVelocity) {
    if (!target) {
      super()
    } else if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = HijackableEventObservable.create(target, event, predicate)
      this.source.operator = new DeltaOperator(computeDelta, computeVelocity)
    }
  }

  lift (operator) {
    const observable = new this.constructor(this)
    observable.operator = operator
    return observable
  }

  accumulate (initialValue) {
    initialValue = this.constructor.createValue(initialValue)
    return this.lift(new AccumulationOperator(initialValue))
  }

  hijack (predicate) {
    return this.lift(new HijackOperator(predicate))
  }

  rect (bounds, initialOffset) {
    let initialValue = {...initialOffset}
    if (initialOffset.x != null || initialOffset.y != null) {
      initialValue.deltaX = initialOffset.x
      initialValue.deltaY = initialOffset.y
    }
    initialValue = this.constructor.createValue(initialValue)
    return this.lift(new RectOperator(bounds, initialValue))
  }

  momentum (optsOrInitialValue, initialValueOrScheduler, scheduler) {
    let opts = optsOrInitialValue
    let initialValue = initialValueOrScheduler

    if (opts && typeof opts.schedule === 'function') {
      scheduler = opts
      opts = null
      initialValue = null
    } else if (opts && (opts.deltaX != null || opts.deltaY != null)) {
      scheduler = initialValue
      initialValue = opts
      opts = null
    } else if (initialValue && typeof initialValue.schedule === 'function') {
      scheduler = initialValue
      initialValue = null
    }

    if (initialValue) {
      initialValue = this.constructor.createValue(initialValue)
    }

    return this.lift(new MomentumOperator(opts, initialValue, scheduler))
  }

  anchor (optsOrInitialValue, initialValueOrScheduler, scheduler) {
    let opts = optsOrInitialValue
    let initialValue = initialValueOrScheduler

    if (opts && typeof opts.schedule === 'function') {
      scheduler = opts
      opts = null
      initialValue = null
    } else if (opts && (opts.deltaX != null || opts.deltaY != null)) {
      scheduler = initialValue
      initialValue = opts
      opts = null
    } else if (initialValue && typeof initialValue.schedule === 'function') {
      scheduler = initialValue
      initialValue = null
    }

    if (initialValue) {
      initialValue = this.constructor.createValue(initialValue)
    }

    return this.lift(new AnchorOperator(opts, initialValue, scheduler))
  }

  // FIXME: This isn't an operator, so should it be here?
  static createValue (opts) {
    opts = {...DEFAULT_VALUE, ...opts}
    const {deltaT, deltaX, deltaY, velocityX, velocityY} = opts
    return {deltaT, deltaX, deltaY, velocityX, velocityY}
  }

  static from (target) {
    return new this(target)
  }

  static merge (...sources) {
    return this.from(merge(...sources))
  }

  static scrollStart (target, event, value) {
    return new this(target, event)::mapTo(this.createValue(value))
  }

  static scrollStop (target, event, value) {
    return new this(target, event)::mapTo(this.createValue(value))
  }

  static move (target, event) {
    return new this(target, event)
  }

  static moveTo (endValue, updater, scheduler) {
    const startValue = this.createValue()
    endValue = this.createValue(endValue)
    return new this(DeltaGeneratorObservable.create(startValue, endValue, updater, scheduler))
  }
}

export default DeltaObservable
