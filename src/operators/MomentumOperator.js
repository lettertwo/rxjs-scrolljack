import {Subscriber} from 'rxjs/Subscriber'
import {DeltaGenerator} from '../observables/DeltaGenerator'
import {momentum} from '../updaters/momentum'

export class MomentumOperator {
  constructor (opts, scheduler) {
    this.opts = opts
    this.scheduler = scheduler
  }

  call (subscriber, source) {
    const {opts, scheduler} = this
    return source._subscribe(new MomentumSubscriber(
      subscriber,
      opts,
      scheduler,
    ))
  }
}

export default MomentumOperator

export class MomentumSubscriber extends Subscriber {
  constructor (destination, opts, scheduler) {
    super(destination)
    this.updater = momentum(opts)
    this.scheduler = scheduler
  }

  _next (value) {
    this.lastValue = value
    if (this.updater.stopped) {
      this.updater.start(value)
    } else {
      this.updater.updateFrame(value)
    }
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
