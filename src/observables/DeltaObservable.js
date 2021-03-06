import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {DeltaGeneratorObservable} from './DeltaGeneratorObservable'
import {HijackableEventObservable} from './HijackableEventObservable'
import {DeltaOperator} from '../operators/DeltaOperator'
import {RectOperator} from '../operators/RectOperator'
import {MomentumOperator} from '../operators/MomentumOperator'
import {AnchorOperator} from '../operators/AnchorOperator'
import {AccumulationOperator} from '../operators/AccumulationOperator'
import {HijackOperator} from '../operators/HijackOperator'
import {hasDelta} from '../utils'

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

  rect (bounds, latestValueOrSourceOrScheduler, scheduler) {
    let latestValueOrSource = latestValueOrSourceOrScheduler
    if (latestValueOrSource.x != null || latestValueOrSource.y != null) {
      latestValueOrSource = this.constructor.createValue({
        deltaX: latestValueOrSource.x,
        deltaY: latestValueOrSource.y,
      })
    } else if (hasDelta(latestValueOrSource)) {
      latestValueOrSource = this.constructor.createValue(latestValueOrSource)
    }

    return this.lift(new RectOperator(bounds, latestValueOrSource, scheduler))
  }

  momentum (optsOrLatestSource, latestSourceOrScheduler, scheduler) {
    return this.lift(new MomentumOperator(
      optsOrLatestSource,
      latestSourceOrScheduler,
      scheduler,
    ))
  }

  anchor (optsOrLatestSource, latestSourceOrScheduler, scheduler) {
    return this.lift(new AnchorOperator(
      optsOrLatestSource,
      latestSourceOrScheduler,
      scheduler,
    ))
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

  static scrollStart (target, event) {
    return new this(target, event)
  }

  static scrollStop (target, event) {
    return new this(target, event)
  }

  static scroll (target, event) {
    return new this(target, event)
  }

  static scrollTo (endValue, updater, scheduler) {
    const startValue = this.createValue()
    endValue = this.createValue(endValue)
    return new this(DeltaGeneratorObservable.create(startValue, endValue, updater, scheduler))
  }
}

export default DeltaObservable
