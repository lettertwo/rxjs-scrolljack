import {BehaviorSubject} from 'rxjs/BehaviorSubject'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {_switch} from 'rxjs/operator/switch'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {ScrollBehaviorOperator} from './operators/ScrollBehaviorOperator'
import {UpdaterStack} from './updaters/UpdaterStack'
import {momentum} from './updaters/momentum'
import {anchor} from './updaters/anchor'
import {bounds} from './updaters/bounds'
import {getRoot} from './utils'

const createDefaultDeltaOperator = Delta => (target, ...args) =>
  Delta.start(target).move(getRoot(), ...args)::_switch()

export class ScrollBehavior extends BehaviorSubject {
  constructor (target, DeltaOrDeltaOperator, rectOrUpdater, updater, initialValue) {
    let deltaOperator
    if (target instanceof ScrollBehavior) {
      super()
      this.source = target
      this.target = target.target
      this.Delta = target.Delta
      this.rect = {...target.rect}
      this._value = {...target._value}
      updater = rectOrUpdater
      deltaOperator = DeltaOrDeltaOperator
    } else {
      super()
      this.target = target
      this.Delta = DeltaOrDeltaOperator
      this.rect = {...rectOrUpdater}
      deltaOperator = createDefaultDeltaOperator(this.Delta)

      const {x = 0, y = 0} = this.rect
      this._value = {x, y, ...initialValue}
    }

    this.bounds = bounds(this.rect, this.Delta.createValue({
      deltaX: this._value.x,
      deltaY: this._value.y,
    }))

    const nextValue = this.bounds.computeNext(this.Delta.createValue())
    this.bounds.updateFrame(nextValue)
    this._value.x += nextValue.deltaX
    this._value.y += nextValue.deltaY

    if (updater instanceof UpdaterStack) {
      // If the passed in updater is an updater stack,
      // clone it and add a bounds updater.
      this.updater = updater.clone()
      this.updater.push(this.bounds)
    } else if (updater) {
      // Otherwise, if it's some other kind of updater,
      // make a new updater stack out of the updater plus a bounds updater.
      this.updater = UpdaterStack.create(updater, this.bounds)
    } else {
      // Otherwise, we have no other updaters, so just make a bounds updater.
      this.updater = this.bounds
    }

    const deltaSource = deltaOperator(this.target, this.updater)
    this.operator = new ScrollBehaviorOperator(deltaSource, this._value)
  }

  _subscribe (subscriber) {
    const subscription = super._subscribe(subscriber)

    if (this.source instanceof ScrollBehavior) {
      subscription.add(this.source._subscribe(this))
    }

    return subscription
  }

  next (value) {
    let nextDelta = this.Delta.computeDelta(this._value, value, this.bounds)
    this.updater.updateFrame(nextDelta)

    return super.next({
      x: this._value.x + nextDelta.deltaX,
      y: this._value.y + nextDelta.deltaY,
    })
  }

  _cloneUpdater () {
    if (this.updater instanceof UpdaterStack && this.updater.size > 1) {
      // If this.updater is an updater stack, clone it, slicing off the
      // current bounds updater (always last in the stack).
      return this.updater.slice(0, -1)
    } else {
      return null
    }
  }

  startWith (value) {
    const updater = this._cloneUpdater()
    const {target, Delta, rect} = this
    return new ScrollBehavior(target, Delta, rect, updater, value)
  }

  moveTo (value, opts, scheduler) {
    const delta = this.Delta.computeDelta(this._value, value, this.updater)
    const updater = anchor(opts)
    const deltaOperator = target =>
      this.Delta.moveTo(delta, updater, scheduler)
    return new ScrollBehavior(this, deltaOperator, updater)
  }

  anchorTo (value, opts, scheduler) {
    const delta = this.Delta.computeDelta(this._value, value, this.updater)
    const updater = anchor(opts)
    const deltaOperator = target => {
      const start = this.Delta.start(target)
      return merge(
        this.Delta.moveTo(delta, updater, scheduler)::takeUntil(start),
        start.move(getRoot(), updater, scheduler)::_switch(),
      )
    }
    return new ScrollBehavior(this, deltaOperator, updater)
  }

  momentum (opts) {
    const cloned = this._cloneUpdater()
    let updater = momentum(opts)
    if (cloned) updater = cloned.add(updater)
    const deltaOperator = createDefaultDeltaOperator(this.Delta)
    return new ScrollBehavior(this, deltaOperator, updater)
  }
}

export default ScrollBehavior
