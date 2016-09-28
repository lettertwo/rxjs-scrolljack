import {Subscriber} from 'rxjs/Subscriber'
import {startWith} from 'rxjs/operator/startWith'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {filter} from 'rxjs/operator/filter'
import {first} from 'rxjs/operator/first'

/**
 * MoveOperator converts an observable of delta values to a higher-order
 * observable that represents a move operation. A move operation is essentially
 * a series of deltas bounded by an initial start delta and a final stop delta.
 */

export class MoveSubscriber extends Subscriber {
  constructor (destination, DeltaObservable, nextSource, stopSource) {
    super(destination)
    this.DeltaObservable = DeltaObservable
    this.nextSource = nextSource
    this.stopSource = stopSource
  }

  _next (starts) {
    // Start with next and stop sources for our move operation.
    let {DeltaObservable, nextSource, stopSource} = this

    stopSource = stopSource.hijack()
      ::filter(createDuplicateFilter())

    nextSource = nextSource.hijack()
      ::filter(createDuplicateFilter())
      ::takeUntil(stopSource)
      ::startWith(starts)

    // Emit the observable of the move operation.
    // The observerable emits values from the start source until
    // our stop source emits, then emits the stop source value.
    return super._next(
      DeltaObservable.create(merge(nextSource, stopSource::first()))
    )
  }
}

export class MoveOperator {
  constructor (DeltaObservable, nextSource, stopSource) {
    this.DeltaObservable = DeltaObservable
    this.nextSource = nextSource
    this.stopSource = stopSource
  }

  call (subscriber, source) {
    return source._subscribe(new MoveSubscriber(
      subscriber,
      this.DeltaObservable,
      this.nextSource,
      this.stopSource,
    ))
  }
}

// HACK: This filters out multiples of the same event.
// FIXME: Why are there ever multiples of the same event???
const createDuplicateFilter = () => {
  let lastTime
  return ({event}) => {
    if (event && event.timeStamp === lastTime) {
      return false
    } else if (event) {
      lastTime = event.timeStamp
    }
    return true
  }
}
