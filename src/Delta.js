import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {_switch} from 'rxjs/operator/switch'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {mapTo} from 'rxjs/operator/mapTo'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'
import {MoveOperator} from './operators/MoveOperator'
import {AccumulationOperator} from './operators/AccumulationOperator'
import {getRoot} from './utils'

const DEFAULT_VALUE = Object.freeze({
  deltaT: 0,
  deltaX: 0,
  deltaY: 0,
  velocityX: 0,
  velocityY: 0,
})

const calculateDeltaX = (start, end) => {
  if ('deltaX' in end) return end.deltaX
  start = 'x' in start ? start.x : 0
  end = 'x' in end ? end.x : 0
  return end - start
}

const calculateDeltaY = (start, end) => {
  if ('deltaY' in end) return end.deltaY
  start = 'y' in start ? start.y : 0
  end = 'y' in end ? end.y : 0
  return end - start
}

export class Delta extends Observable {
  constructor (target, event, ...hijackArgs) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromHijackedEvent(target, event, ...hijackArgs)
      this.source.operator = new DeltaOperator()
    }
  }

  lift (operator) {
    const observable = new this.constructor(this)
    observable.operator = operator
    return observable
  }

  accumulate (initialValue) {
    return this.lift(
      new AccumulationOperator(this.constructor.createValue(initialValue))
    )
  }

  // FIXME: This isn't an operator, so should it be here?
  static createValue (opts) {
    opts = {...DEFAULT_VALUE, ...opts}
    const {deltaT, deltaX, deltaY, velocityX, velocityY} = opts
    return {deltaT, deltaX, deltaY, velocityX, velocityY}
  }

  // FIXME: This isn't an operator, so should it be here?
  static computeDelta (startValue, endValue, updater) {
    const value = this.createValue({
      deltaX: calculateDeltaX(startValue, endValue),
      deltaY: calculateDeltaY(startValue, endValue),
    })
    if (updater) {
      if (typeof updater === 'function') updater = updater()
      return updater.computeNext(value)
    } else {
      return value
    }
  }

  static create (target) {
    return new this(target)
  }

  static from (target) {
    return new this(target)::takeUntil(this.stop(target))
  }

  static move (target, updater, scheduler, root = getRoot()) {
    if (typeof updater === 'function') updater = updater()
    const nextSource = this.create(root)
    const stopSource = this.stop(root)
    return this
      .start(target)
      .lift(new MoveOperator(nextSource, stopSource, updater, scheduler))
      ::_switch()
  }

  static start (target, event, value) {
    return new this(target, event)::mapTo(this.createValue(value))
  }

  static stop (target, event, value) {
    return new this(target, event)::mapTo(this.createValue(value))
  }
}

export const combineDeltas = (...DeltaClasses) => {
  class MultiDelta extends Delta {
    constructor (target) {
      if (typeof target[$$observable] === 'function') {
        super(target)
      } else {
        super(merge(...DeltaClasses.map(DeltaClass => (
          DeltaClass.create(target)
        ))))
      }
    }

    static start (target) {
      return this.create(merge(...DeltaClasses.map(DeltaClass => (
        DeltaClass.start(target)
      ))))
    }

    static move (target, updater, scheduler) {
      if (typeof updater === 'function') updater = updater()
    // FIXME: Releasing outside doesn't work! We need a way to specify
    // roots to create and stop that are different from target
    // (and specific to each wrapped Delta class).
      const nextSource = this.create(target)
      const stopSource = this.stop(target)
      return this
        .start(target)
        .lift(new MoveOperator(nextSource, stopSource, updater, scheduler))
        ::_switch()
    }

    static stop (target) {
      return this.create(merge(...DeltaClasses.map(DeltaClass => (
        DeltaClass.stop(target)
      ))))
    }
  }

  return MultiDelta
}

export default Delta
