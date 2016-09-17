import {BehaviorSubject} from 'rxjs/BehaviorSubject'
import {ScrollBehaviorOperator} from './operators/ScrollBehaviorOperator'
import {UpdaterStack} from './kinematic/UpdaterStack'
import {momentum} from './kinematic/momentum'
import {anchor} from './kinematic/anchor'
import {bounds} from './kinematic/bounds'

export class ScrollBehavior extends BehaviorSubject {
  constructor (target, DeltaOrUpdater, rect, updater, initialValue) {
    if (target instanceof ScrollBehavior) {
      super()
      this.source = target
      this.target = target.target
      this.Delta = target.Delta
      this.rect = {...target.rect}
      this._value = {...target._value}
      updater = DeltaOrUpdater
    } else {
      super()
      this.target = target
      this.Delta = DeltaOrUpdater
      this.rect = {...rect}

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

    const deltaSource = this.Delta.move(this.target, this.updater)
    this.operator = new ScrollBehaviorOperator(deltaSource, this._value)
  }

  _subscribe (subscriber) {
    const subscription = super._subscribe(subscriber)

    if (this.source instanceof ScrollBehavior) {
      subscription.add(this.source._subscribe(this))
    }

    return subscription
  }

  cloneUpdater () {
    if (this.updater instanceof UpdaterStack && this.updater.size > 1) {
      // If this.updater is an updater stack, clone it, slicing off the
      // current bounds updater (always last in the stack).
      return this.updater.slice(0, -1)
    } else {
      return null
    }
  }

  liftUpdater (updater) {
    // Clone our updater, if we have one. If we do, it's an updater stack,
    // so add the updater we're 'lifting' (The ctor will add a bounds updater
    // to the end of the stack).
    const cloned = this.cloneUpdater()
    if (cloned) updater = cloned.add(updater)
    return new ScrollBehavior(this, updater)
  }

  next (value) {
    let nextDelta = this.Delta.computeDelta(this._value, value, this.bounds)
    this.updater.updateFrame(nextDelta)

    return super.next({
      x: this._value.x + nextDelta.deltaX,
      y: this._value.y + nextDelta.deltaY,
    })
  }

  startWith (value) {
    return new ScrollBehavior(this.target, this.Delta, this.rect, this.cloneUpdater(), value)
  }

  moveTo (value, opts, scheduler) {
    const delta = this.Delta.computeDelta(this._value, value, this.updater)
    const target = this.target
    const updater = anchor(opts)
    // TODO: Switch back to original delta source when move completes?
    const deltaSource = this.Delta.moveTo(target, delta, updater, scheduler)
    const behavior = new ScrollBehavior(this, updater)
    behavior.operator = new ScrollBehaviorOperator(deltaSource, this.rect)
    return behavior
  }

  momentumX (opts) {
    return this.liftUpdater(momentum.x(opts))
  }

  momentumY (opts) {
    return this.liftUpdater(momentum.y(opts))
  }

  momentum (opts) {
    return this.liftUpdater(momentum(opts))
  }

  anchorX (opts) {
    return this.liftUpdater(anchor.x(opts))
  }

  anchorY (opts) {
    return this.liftUpdater(anchor.y(opts))
  }

  anchor (opts) {
    return this.liftUpdater(anchor(opts))
  }
}

export default ScrollBehavior
