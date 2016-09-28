import {Subscriber} from 'rxjs/Subscriber'
import {DeltaGenerator} from '../observables/DeltaGenerator'
import {anchor} from '../updaters/anchor'

export class AnchorOperator {
  constructor (opts, initialValue, scheduler) {
    this.opts = opts
    this.initialValue = initialValue
    this.scheduler = scheduler
  }

  call (subscriber, source) {
    const {opts, initialValue, scheduler} = this
    return source._subscribe(new AnchorSubscriber(
      subscriber,
      opts,
      initialValue,
      scheduler,
    ))
  }
}

export default AnchorOperator

export class AnchorSubscriber extends Subscriber {
  constructor (destination, opts, initialValue, scheduler) {
    super(destination)
    this.updater = anchor(opts)
    this.scheduler = scheduler
    if (initialValue) {
      this.updater.updateFrame(initialValue)
    }
  }

  _next (value) {
    if (this.updater.stopped) {
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
