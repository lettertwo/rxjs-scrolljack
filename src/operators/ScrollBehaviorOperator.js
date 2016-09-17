import {Subscriber} from 'rxjs/Subscriber'

export class ScrollBehaviorSubscriber extends Subscriber {
  constructor (destination, behavior, initialValue = {x: 0, y: 0}) {
    super(destination)
    this.behavior = behavior
    this.add(behavior._subscribe(new Subscriber(this.withLatestFromSubject)))
    this.latestFromSubject = {...initialValue}
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

export class ScrollBehaviorOperator {
  constructor (deltaSource, initialValue) {
    this.deltaSource = deltaSource
    this.initialValue = initialValue
  }

  call (subscriber, behavior) {
    return this.deltaSource.subscribe(
      new ScrollBehaviorSubscriber(subscriber, behavior, this.initialValue)
    )
  }
}

export default ScrollBehaviorOperator
