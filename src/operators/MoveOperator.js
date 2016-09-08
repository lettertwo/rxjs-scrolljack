import {Subscriber} from 'rxjs/Subscriber'
import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {from} from 'rxjs/observable/from'
import {startWith} from 'rxjs/operator/startWith'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {mergeMap} from 'rxjs/operator/mergeMap'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {map} from 'rxjs/operator/map'
import {first} from 'rxjs/operator/first'

const F = 1000 / 60  // Default frame rate

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
  constructor (destination, Delta, target, updater, scheduler = animationFrame) {
    super(destination)
    this.Delta = Delta
    this.target = target
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

  createNextSource = stops => from(
    createNextGenerator(this.scheduler, this.updater, stops, this.scheduler.now()),
    this.scheduler,
  )

  _next (starts) {
    // Create next and stop sources for our move operation.
    let nextSource = this.Delta.create(this.target)
    let stopSource = this.Delta.stop(this.target)

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
  constructor (Delta, target, updater, scheduler) {
    this.Delta = Delta
    this.target = target
    this.updater = updater
    this.scheduler = scheduler
  }

  call (subscriber, source) {
    return source._subscribe(new MoveSubscriber(
      subscriber,
      this.Delta,
      this.target,
      this.updater,
      this.scheduler,
    ))
  }
}

function * createNextGenerator (scheduler, updater, lastValue, time) {
  while (updater.shouldGenerateNext()) {
    let {
      deltaX = 0,
      deltaY = 0,
    } = lastValue

    let now = scheduler.now()
    let deltaT = now - time

    // If it seems like we've dropped a lot of frames, its probably because
    // this process was backgrounded (switched tabs), so we should restart.
    if (deltaT > F * 10) {
      deltaT = F
    }

    // Calculate the number of frames that have been 'dropped' since the
    // last update. Dropped frames are updates that should've happened within
    // a window of time, but didn't, usually because of jank, normalizing
    // optimizations, or other delays introduced by the user/browser/runtime.
    let droppedFrames = Math.floor(deltaT / F)

    let newValue = {deltaX, deltaY, deltaT}

    if (droppedFrames) {
      let droppedValue = {
        deltaX: deltaX / (droppedFrames + 1),
        deltaY: deltaY / (droppedFrames + 1),
        deltaT: F,
      }
      // Subtract dropped frames' deltas from the original deltas
      // to get the deltas for just the latest frame.
      deltaX = deltaX - droppedValue.deltaX * droppedFrames
      deltaY = deltaY - droppedValue.deltaY * droppedFrames
      deltaT = deltaT - droppedValue.deltaT * droppedFrames

      // Apply the dropped frame deltas to the destination.
      for (let i = 0; i < droppedFrames; i++) {
        droppedValue = updater.computeNext(droppedValue)
        updater.catchFrame(droppedValue)
      }

      newValue = droppedValue
    }

    time = now
    lastValue = updater.computeNext(newValue)
    updater.updateFrame(lastValue)

    yield lastValue
  }
}
