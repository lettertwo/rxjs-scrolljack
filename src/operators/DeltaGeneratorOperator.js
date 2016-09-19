import {Subscriber} from 'rxjs/Subscriber'
import {Subject} from 'rxjs/Subject'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {fromDeltaGenerator} from './fromDeltaGenerator'
import {anchor} from '../updaters/anchor'

export class DeltaGeneratorSubscriber extends Subscriber {
  constructor (destination, initialValue, updater = anchor, scheduler) {
    super(destination)
    this.stopSource = new Subject()
    super._next(
      fromDeltaGenerator(initialValue, updater, scheduler)
        ::takeUntil(this.stopSource)
    )
  }

  _next (stops) {
    this.stopSource.next(stops)
  }
}

export class DeltaGeneratorOperator {
  constructor (initialValue, updater, scheduler) {
    this.initialValue = initialValue
    this.updater = updater
    this.scheduler = scheduler
  }

  call (subscriber, source) {
    return source._subscribe(new DeltaGeneratorSubscriber(
      subscriber,
      this.initialValue,
      this.updater,
      this.scheduler,
    ))
  }
}

export default DeltaGeneratorOperator
