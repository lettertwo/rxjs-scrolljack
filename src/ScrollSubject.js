import $$observable from 'symbol-observable'
import {Subscriber} from 'rxjs/Subscriber'
import {Subject} from 'rxjs/Subject'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {Touch} from './Touch'
import {Wheel} from './Wheel'
import {Keyboard} from './Keyboard'
import {parseXOpts, parseYOpts} from './kinematic/parseOpts'
import {Anchor} from './kinematic/Anchor'
import {Momentum} from './kinematic/Momentum'

export class ScrollSubject extends Subject {

  constructor (target, startSourceOrRect, stopSource, rect) {
    let startSource

    if (startSourceOrRect && typeof startSourceOrRect[$$observable] !== 'function') {
      rect = startSourceOrRect
    } else {
      startSource = startSourceOrRect
    }
    startSourceOrRect = null

    if (typeof rect === 'undefined') {
      throw new Error('A scroll offset rect of the shape {x, y, width, height} is required')
    }

    if (typeof target[$$observable] === 'function') {
      if (!startSource || typeof startSource[$$observable] !== 'function') {
        throw new Error('A start source observable is required when the target is an observable')
      }
      if (!stopSource || typeof stopSource[$$observable] !== 'function') {
        throw new Error('A stop source observable is required when the target is an observable')
      }

      super()
      this.source = target[$$observable]()
      this.startSource = startSource[$$observable]()
      this.stopSource = stopSource[$$observable]()
      this.rect = rect
    } else {
      super()
      this.source = merge(
        Wheel.move(target),
        Touch.move(target),
        Keyboard.move(target),
      )
      this.startSource = merge(
        Wheel.start(target),
        Touch.start(target),
        Keyboard.start(target),
      )
      this.stopSource = merge(
        Wheel.stop(target),
        Touch.stop(target),
        Keyboard.stop(target),
      )
      this.rect = rect
    }
  }

  subscribe (subscriber) {
    return this.source.subscribe(
      new ScrollSubjectSubscriber(subscriber, this, this.rect)
    )
  }

  lift (operator) {
    const subject = new ScrollSubject(
      this.source,
      this.startSource,
      this.stopSource,
      this.rect,
    )
    subject.operator = operator
    return subject
  }

  withRect (rect) {
    return new ScrollSubject(
      this.source,
      this.startSource,
      this.stopSource,
      rect,
    )
  }

  anchorX (opts, scheduler) {
    const anchoredSource = new Anchor(
      parseXOpts(opts),
      this.source,
      this.startSource,
      this.stopSource,
      scheduler,
    )

    return new ScrollSubject(
      anchoredSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }

  anchorY (opts, scheduler) {
    const anchoredSource = new Anchor(
      parseYOpts(opts),
      this.source,
      this.startSource,
      this.stopSource,
      scheduler,
    )

    return new ScrollSubject(
      anchoredSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }

  anchor (opts, scheduler) {
    const anchoredSource = new Anchor(
      [parseXOpts(opts), parseYOpts(opts)],
      this.source,
      this.startSource,
      this.stopSource,
      scheduler,
    )

    return new ScrollSubject(
      anchoredSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }

  momentumX (opts, scheduler) {
    const momentumSource = new Momentum(
      parseXOpts(opts),
      this.source,
      this.startSource,
      this.stopSource,
      scheduler,
    )

    return new ScrollSubject(
      momentumSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }

  momentumY (opts, scheduler) {
    const momentumSource = new Momentum(
      parseYOpts(opts),
      this.source,
      this.startSource,
      this.stopSource,
      scheduler,
    )

    return new ScrollSubject(
      momentumSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }

  momentum (opts, scheduler) {
    const momentumSource = new Momentum(
      [parseXOpts(opts), parseYOpts(opts)],
      this.source,
      this.startSource,
      this.stopSource,
      scheduler,
    )

    return new ScrollSubject(
      momentumSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }
}

export default ScrollSubject

class ScrollSubjectSubscriber extends Subscriber {
  constructor (destination, subject, dimensions) {
    super(destination)
    this.minX = dimensions.x || 0
    this.minY = dimensions.y || 0
    this.maxX = dimensions.width || 0
    this.maxY = dimensions.height || 0
    this.subject = subject
    this.latestFromSubject = {x: this.minX, y: this.minY}
    this.add(subject._subscribe(new Subscriber(this.withLatestFromSubject)))
  }

  withLatestFromSubject = latestFromSubject => {
    this.latestFromSubject = latestFromSubject
    this._next()
  }

  _next ({deltaX, deltaY} = {}) {
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
    this.subject = null
    this.latestFromSubject = null
  }
}
