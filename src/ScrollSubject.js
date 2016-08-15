import $$observable from 'symbol-observable'
import {Subscriber} from 'rxjs/Subscriber'
import {Subject} from 'rxjs/Subject'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {Touch} from './Touch'
import {Wheel} from './Wheel'
import {Keyboard} from './Keyboard'

export class ScrollSubject extends Subject {

  constructor (targetOrRect, rect, ...sources) {
    if (typeof rect[$$observable] === 'function') {
      super()
      this.sources = [
        rect[$$observable](),
        ...sources.map(source => source[$$observable]()),
      ]
      this.rect = targetOrRect
    } else if (typeof rect === 'undefined') {
      throw new Error('A scroll offset rect of the shape {x, y, width, height} is required')
    } else {
      super()
      this.sources = [
        Wheel.move(targetOrRect),
        Touch.move(targetOrRect),
        Keyboard.move(targetOrRect),
        ...sources.map(source => source[$$observable]()),
      ]
      this.rect = rect
    }
    this.source = merge(...this.sources)
  }

  subscribe (subscriber) {
    return this.source.subscribe(
      new ScrollSubjectSubscriber(subscriber, this, this.rect)
    )
  }

  lift (operator) {
    const subject = new ScrollSubject(this.rect, ...this.sources)
    subject.operator = operator
    return subject
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
    this.add(subject._subscribe(this.withLatestFromSubject))
  }

  withLatestFromSubject = latestFromSubject => {
    this.latestFromSubject = latestFromSubject
  }

  _next ({deltaX, deltaY}) {
    let nextValue = {
      x: this.latestFromSubject.x + deltaX,
      y: this.latestFromSubject.y + deltaY,
    }
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
