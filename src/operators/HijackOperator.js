import {Subscriber} from 'rxjs/Subscriber'

export class HijackOperator {
  constructor (predicate) {
    this.predicate = predicate
  }

  call (subscriber, source) {
    return source._subscribe(new HijackSubscriber(subscriber, this.predicate))
  }
}

export default HijackOperator

export class HijackSubscriber extends Subscriber {
  constructor (destination, predicate) {
    super(destination)
    this.predicate = predicate
  }

  _next (value) {
    const {event = value} = value
    const shouldHijack = (
      !event.defaultPrevented &&
      typeof event.preventDefault === 'function' &&
      (typeof this.predicate !== 'function' || this.predicate(event))
    )
    if (shouldHijack) event.preventDefault()
    super._next(value)
  }
}
