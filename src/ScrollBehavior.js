import {Subscriber} from 'rxjs/Subscriber'
import {BehaviorSubject} from 'rxjs/BehaviorSubject'
import {createUpdaterStack} from './kinematic/createUpdaterStack'
import {momentum} from './kinematic/momentum'
import {anchor} from './kinematic/anchor'

export class ScrollBehavior extends BehaviorSubject {
  constructor (target, Delta, rect, updaterStack, initialValue) {
    super()
    this.target = target
    this.Delta = Delta
    this.rect = {...rect}
    const {x = 0, y = 0} = this.rect
    this._value = {x, y, ...initialValue}
    this.updaterStack = updaterStack || createUpdaterStack()
    this.source = Delta.move(this.target, this.updaterStack)
    this.operator = new ScrollBehaviorOperator(this.source, this.rect)
  }

  liftUpdater (updater) {
    const {target, Delta, rect, _value} = this
    let updaterStack = this.updaterStack.clone()
    updaterStack.add(updater)
    return new ScrollBehavior(target, Delta, rect, updaterStack, _value)
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

class ScrollBehaviorOperator {
  constructor (source, rect) {
    this.source = source
    this.rect = rect
  }

  call (subscriber, behavior) {
    return this.source.subscribe(
      new ScrollBehaviorSubscriber(subscriber, behavior, this.rect)
    )
  }
}

class ScrollBehaviorSubscriber extends Subscriber {
  constructor (destination, behavior, dimensions) {
    super(destination)
    this.minX = dimensions.x || 0
    this.minY = dimensions.y || 0
    this.maxX = dimensions.width || 0
    this.maxY = dimensions.height || 0
    this.behavior = behavior
    this.latestFromSubject = {x: this.minX, y: this.minY}
    this.add(behavior._subscribe(new Subscriber(this.withLatestFromSubject)))
  }

  withLatestFromSubject = latestFromSubject => {
    if (latestFromSubject) {
      this.latestFromSubject = latestFromSubject
      this._next()
    }
  }

  _next ({deltaX = 0, deltaY = 0} = {}) {
    let nextValue = {
      x: this.latestFromSubject.x,
      y: this.latestFromSubject.y,
    }

    this.latestFromSubject.x = nextValue.x + deltaX
    nextValue.x = Math.round(this.latestFromSubject.x)

    this.latestFromSubject.y = nextValue.y + deltaY
    nextValue.y = Math.round(this.latestFromSubject.y)

    super._next(nextValue)
  }

  _complete () {
    this.minX = null
    this.maxX = null
    this.minY = null
    this.maxY = null
    this.behavior = null
    this.latestFromSubject = null
  }
}
