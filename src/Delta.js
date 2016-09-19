import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {exhaust} from 'rxjs/operator/exhaust'
import {mapTo} from 'rxjs/operator/mapTo'
import {take} from 'rxjs/operator/take'
import {fromDeltaGenerator} from './operators/fromDeltaGenerator'
import {fromHijackableEvent} from './operators/fromHijackableEvent'
import {DeltaOperator} from './operators/DeltaOperator'
import {MoveOperator} from './operators/MoveOperator'
import {AccumulationOperator} from './operators/AccumulationOperator'
import {HijackOperator} from './operators/HijackOperator'
import {anchor} from './updaters/anchor'

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
    if (!target) {
      super()
    } else if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromHijackableEvent(target, event, ...hijackArgs)
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

  hijack (predicate) {
    return this.lift(new HijackOperator(predicate))
  }

  move (root, updater, scheduler) {
    if (typeof updater === 'function') updater = updater()

    const nextSource = this.constructor.create(root)
    const stopSource = this.constructor.stop(root)

    return this.lift(new MoveOperator(nextSource, stopSource, updater, scheduler))
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

  static start (target, event, value) {
    return new this(target, event)::mapTo(this.createValue(value))
  }

  static stop (target, event, value) {
    return new this(target, event)::mapTo(this.createValue(value))
  }

  static move (target, ...args) {
    return this.create(target)::take(1).move(target, ...args)::exhaust()
  }

  static moveTo (endValue, updater, scheduler) {
    const startValue = this.createValue()
    return new this(new Generator(startValue, endValue, updater, scheduler))
  }
}

export class Generator extends Observable {
  constructor (startValue, endValue, updater = anchor, scheduler = animationFrame) {
    super()
    this.startValue = startValue
    this.endValue = endValue
    this.updater = updater
    this.scheduler = scheduler
  }

  _subscribe (subscriber) {
    let {startValue, endValue, updater, scheduler} = this
    if (typeof updater === 'function') updater = updater()

    // We subtract our target delta from the updater's net delta so that
    // it ends up generating that amount of delta in the original orientation
    // as it attempts to bring the netDelta back to 0.
    updater.updateFrame({
      ...endValue,
      deltaX: startValue.deltaX - endValue.deltaX,
      deltaY: startValue.deltaY - endValue.deltaY,
    })

    return fromDeltaGenerator(startValue, updater, scheduler)
      ._subscribe(subscriber)
  }
}

export const combineDeltas = (...DeltaClasses) => {
  // FIXME: Releasing outside doesn't work! We need a way to specify
  // roots to create and stop that are different from target!
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

    static stop (target) {
      return this.create(merge(...DeltaClasses.map(DeltaClass => (
        DeltaClass.stop(target)
      ))))
    }
  }

  return MultiDelta
}

export default Delta
