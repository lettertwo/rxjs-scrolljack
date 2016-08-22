import $$observable from 'symbol-observable'
import {Subscriber} from 'rxjs/Subscriber'
import {Subject} from 'rxjs/Subject'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {Touch} from './Touch'
import {Wheel} from './Wheel'
import {Keyboard} from './Keyboard'
import {MomentumOperator} from './operators/MomentumOperator'
import {
  AnchorOperator,
  parseAnchorXOpts,
  parseAnchorYOpts,
} from './operators/kinematic/AnchorOperator'

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
    const anchoredSource = this.source.lift(new AnchorOperator(
      parseAnchorXOpts(opts),
      this.startSource,
      this.stopSource,
      scheduler,
    ))

    return new ScrollSubject(
      anchoredSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }

  anchorY (opts, scheduler) {
    const anchoredSource = this.source.lift(new AnchorOperator(
      parseAnchorYOpts(opts),
      this.startSource,
      this.stopSource,
      scheduler,
    ))

    return new ScrollSubject(
      anchoredSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }

  anchor (opts, scheduler) {
    const anchoredSource = this.source.lift(new AnchorOperator(
      [parseAnchorXOpts(opts), parseAnchorYOpts(opts)],
      this.startSource,
      this.stopSource,
      scheduler,
    ))

    return new ScrollSubject(
      anchoredSource,
      this.startSource,
      this.stopSource,
      this.rect,
    )
  }

  momentum (opts, scheduler) {
    return new ScrollSubject(
      this.source.lift(new MomentumOperator(
        this.startSource,
        this.stopSource,
        scheduler,
      )),
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

    if (deltaX) nextValue.x += deltaX
    if (deltaY) nextValue.y += deltaY

    if (nextValue.x < this.minX) nextValue.x = this.minX
    if (nextValue.x > this.maxX) nextValue.x = this.maxX
    if (nextValue.y < this.minY) nextValue.y = this.minY
    if (nextValue.y > this.maxY) nextValue.y = this.maxY
    this.latestFromSubject = nextValue
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
