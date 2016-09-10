import {BehaviorSubject} from 'rxjs/BehaviorSubject'
import {ScrollBehaviorOperator} from './operators/ScrollBehaviorOperator'
import {UpdaterStack} from './kinematic/UpdaterStack'
import {momentum} from './kinematic/momentum'
import {anchor} from './kinematic/anchor'
import {bounds} from './kinematic/bounds'

export class ScrollBehavior extends BehaviorSubject {
  constructor (target, Delta, rect, updater, initialValue) {
    super()
    this.target = target
    this.Delta = Delta
    this.rect = {...rect}

    const {x = 0, y = 0} = this.rect

    this._value = {x, y, ...initialValue}

    const boundsUpdater = bounds(this.rect, Delta.createValue({
      deltaX: this._value.x,
      deltaY: this._value.y,
    }))

    const nextValue = boundsUpdater.computeNext(Delta.createValue())
    boundsUpdater.updateFrame(nextValue)
    this._value.x += nextValue.deltaX
    this._value.y += nextValue.deltaY

    if (updater instanceof UpdaterStack) {
      // If the passed in updater is an updater stack,
      // clone it and add a bounds updater.
      this.updater = updater.clone()
      this.updater.push(boundsUpdater)
    } else if (updater) {
      // Otherwise, if it's some other kind of updater,
      // make a new updater stack out of the updater plus a bounds updater.
      this.updater = UpdaterStack.create(updater, boundsUpdater)
    } else {
      // Otherwise, we have no other updaters, so just make a bounds updater.
      this.updater = boundsUpdater
    }

    this.source = Delta.move(this.target, this.updater)
    this.operator = new ScrollBehaviorOperator(this.source, this.rect)
  }

  liftUpdater (updater) {
    const {target, Delta, rect, _value} = this
    let updaterStack = this.updater
    if (updaterStack instanceof UpdaterStack) {
      // If this updater is already an updater stack, clone it,
      // but pop off the current bounds updater.
      // (The ctor will add a bounds updater back to the end of the stack).
      updaterStack = updaterStack.clone()
      updaterStack.pop()
    } else {
      // Otherwise, make a new updater stack.
      updaterStack = new UpdaterStack()
    }
    // Add the updater we're 'lifting' to the new stack.
    updaterStack.push(updater)
    return new ScrollBehavior(target, Delta, rect, updaterStack, _value)
  }

  startWith (initialValue) {
    const {target, Delta, rect, _value} = this

    let updater
    if (this.updater instanceof UpdaterStack) {
      updater = this.updater.clone()
      updater.pop()
    }

    initialValue = {..._value, ...initialValue}

    return new ScrollBehavior(target, Delta, rect, updater, initialValue)
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
