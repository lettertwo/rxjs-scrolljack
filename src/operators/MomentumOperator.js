import $$observable from 'symbol-observable'
import {Subscriber} from 'rxjs/Subscriber'
import {DeltaGenerator} from '../observables/DeltaGenerator'
import {momentum} from '../updaters/momentum'
import {hasDelta} from '../utils'

export class MomentumOperator {
  constructor (opts, initialValue, scheduler) {
    this.opts = opts
    this.initialValue = initialValue
    this.scheduler = scheduler
  }

  call (subscriber, source) {
    const {opts, initialValue, scheduler} = this
    return source._subscribe(new MomentumSubscriber(
      subscriber,
      opts,
      initialValue,
      scheduler,
    ))
  }
}

export default MomentumOperator

export class MomentumSubscriber extends Subscriber {
  constructor (destination, opts, initialValue, scheduler) {
    super(destination)
    this.updater = momentum(opts)
    this.scheduler = scheduler
    if (initialValue && hasDelta(initialValue)) {
      this.updater.updateFrame(initialValue)
    }
  }

  _next (value) {
    this.lastValue = value
    if (this.updater.stopped) {
      if (this.initialValue) value = this.initialValue
      this.updater.start(value)
    } else {
      value = this.updater.computeNext(value)
      this.updater.updateFrame(value)
    }

    this.lastValue = value
    super._next(value)
  }

  _complete () {
    const {destination: subscriber, lastValue, updater, scheduler} = this

    updater.stop(lastValue)

    this.add(DeltaGenerator
      .from(lastValue, updater, scheduler)
      .subscribe({
        next: value => { subscriber.next(value) },
        complete: () => { super._complete() },
      })
    )
  }
}
