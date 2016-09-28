import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {exhaust} from 'rxjs/operator/exhaust'
import {mapTo} from 'rxjs/operator/mapTo'
import {take} from 'rxjs/operator/take'
import {DeltaGenerator} from './DeltaGenerator'
import {HijackableEventObservable} from './HijackableEventObservable'
import {DeltaOperator} from '../operators/DeltaOperator'
import {MoveOperator} from '../operators/MoveOperator'
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

export class DeltaObservable extends Observable {
  constructor (target, event, ...hijackArgs) {
    if (!target) {
      super()
    } else if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = HijackableEventObservable.create(target, event, ...hijackArgs)
      this.source.operator = new DeltaOperator()
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

  move (root) {
    const nextSource = this.constructor.create(root)
    const stopSource = this.constructor.stop(root)
    return this.lift(new MoveOperator(this.constructor, nextSource, stopSource))
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

  momentum (opts, scheduler) {
    return this.lift(new MomentumOperator(opts, scheduler))
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

  // FIXME: This isn't an operator, so should it be here?
  static confineDeltaToRect (bounds, {x = 0, y = 0} = {}, {deltaX = 0, deltaY = 0} = {}) {
    let minX = bounds.x || 0
    let maxX = minX + (bounds.width || 0)
    let minY = bounds.y || 0
    let maxY = minY + (bounds.height || 0)

    let nx = x + deltaX
    let ny = y + deltaY

    if (nx < minX) deltaX -= nx - minX
    else if (nx > maxX) deltaX -= nx - maxX

    if (ny < minY) deltaY -= ny - minY
    else if (ny > maxY) deltaY -= ny - maxY

    return this.createValue({deltaX, deltaY})
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
    return new this(DeltaGenerator.create(startValue, endValue, updater, scheduler))
  }
}

export default DeltaObservable
