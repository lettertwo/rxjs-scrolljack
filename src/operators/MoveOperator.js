import {Subscriber} from 'rxjs/Subscriber'
import {startWith} from 'rxjs/operator/startWith'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {mergeMap} from 'rxjs/operator/mergeMap'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {map} from 'rxjs/operator/map'
import {first} from 'rxjs/operator/first'
import {fromDeltaGenerator} from './fromDeltaGenerator'

/**
 * MoveOperator converts an observable of delta values to a higher-order
 * observable that represents a move operation. A move operation is essentially
 * a series of deltas bounded by an initial start delta and a final stop delta.
 *
 * Subclasses may define a `_computeNext` method, which will allow deltas to
 * be mapped to values before being emitted.
 *
 * Subclasses may also define a `_generateNext` method, which should return an
 * iterable of values to emit after the target has stopped. This allows a
 * subclass to essentially 'fake' more deltas, i.e., decceleration, snapping
 * or restorative behaviors, etc.
 */

export class MoveSubscriber extends Subscriber {
  constructor (destination, nextSource, stopSource, updater, scheduler) {
    super(destination)
    this.nextSource = nextSource
    this.stopSource = stopSource
    this.updater = updater
    this.scheduler = scheduler
  }

  start = value => this.updater.start(value)

  stop = value => this.updater.stop(value)

  computeNext = value => {
    value = this.updater.computeNext(value)
    this.updater.updateFrame(value)
    return value
  }

  createNextSource = stops => (
    fromDeltaGenerator(stops, this.updater, this.scheduler)
  )

  _next (starts) {
    // Start with next and stop sources for our move operation.
    let {nextSource, stopSource} = this

    nextSource = nextSource.hijack()
    stopSource = stopSource.hijack()

    // If we don't have an updater, skip to the end.
    if (!this.updater) {
      return merge(
        nextSource::takeUntil(stopSource)::startWith(starts),
        stopSource::first(),
      )
    }

    // If we're extended to compute next values,
    // map next to the update method.
    if (typeof this.updater.computeNext === 'function') {
      nextSource = nextSource::map(this.computeNext)
    }

    // If we're extended to compute stop values,
    // map stop to the update method.
    if (typeof this.updater.stop === 'function') {
      nextSource = nextSource::takeUntil(stopSource::map(this.stop))
    } else {
      nextSource = nextSource::takeUntil(stopSource)
    }

    if (typeof this.updater.start === 'function') {
    // Start with the value that triggered this operation.
      nextSource = nextSource::startWith(this.start(starts))
    } else {
      // Start with the value that triggered this operation.
      nextSource = nextSource::startWith(starts)
    }

    // If we're extended to generate additional next values,
    // concatenate additional next values after we stop.
    stopSource = stopSource::first()::mergeMap(this.createNextSource)

    // Emit the observable of the move operation.
    // The observerable emits values from the start source until
    // our stop source emits, then emits values from the stop source
    // until it completes.
    super._next(merge(nextSource, stopSource))
  }
}

export class MoveOperator {
  constructor (nextSource, stopSource, updater, scheduler) {
    this.nextSource = nextSource
    this.stopSource = stopSource
    this.updater = updater
    this.scheduler = scheduler
  }

  call (subscriber, source) {
    return source._subscribe(new MoveSubscriber(
      subscriber,
      this.nextSource,
      this.stopSource,
      this.updater,
      this.scheduler,
    ))
  }
}
