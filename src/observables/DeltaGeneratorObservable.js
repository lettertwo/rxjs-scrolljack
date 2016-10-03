import {Observable} from 'rxjs/Observable'
import {from} from 'rxjs/observable/from'
import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {anchor} from '../updaters/anchor'

export class DeltaGeneratorObservable extends Observable {
  constructor (startValue, endValue, updater, scheduler) {
    super()
    this.startValue = startValue
    this.endValue = endValue
    this.updater = updater
    this.scheduler = scheduler
  }

  _subscribe (subscriber) {
    let {startValue, endValue, updater, scheduler} = this
    if (typeof updater === 'function') updater = updater()

    if (endValue) {
      // We subtract our target delta from the updater's net delta so that
      // it ends up generating that amount of delta in the original orientation
      // as it attempts to bring the netDelta back to 0.
      updater.updateFrame({
        ...endValue,
        deltaX: startValue.deltaX - endValue.deltaX,
        deltaY: startValue.deltaY - endValue.deltaY,
      })
    }

    return DeltaGeneratorObservable.from(updater, scheduler, startValue)
      ._subscribe(subscriber)
  }

  static create (startValue, endValue, updater = anchor, scheduler = animationFrame) {
    return new DeltaGeneratorObservable(startValue, endValue, updater, scheduler)
  }

  static from (updater = anchor, scheduler = animationFrame, initialValue) {
    return from(
      createDeltaGenerator(scheduler, updater, scheduler.now(), initialValue),
      scheduler,
    )
  }
}

export default DeltaGeneratorObservable

const F = 1000 / 60  // Default frame rate

function * createDeltaGenerator (scheduler, updater, time, lastValue = {}) {
  while (updater.shouldGenerateNext()) {
    let {
      deltaX = 0,
      deltaY = 0,
    } = lastValue

    let now = scheduler.now()
    let deltaT = now - time

    // If it's too soon to update, drop an update.
    if (deltaT < 1) continue

    // If it seems like we've dropped a lot of frames, its probably because
    // this process was backgrounded (switched tabs), so we should restart.
    if (deltaT > F * 10) {
      deltaT = F
    }

    let t = deltaT / 1000

    // Calculate the number of frames that have been 'dropped' since the
    // last update. Dropped frames are updates that should've happened within
    // a window of time, but didn't, usually because of jank, normalizing
    // optimizations, or other delays introduced by the user/browser/runtime.
    let droppedFrames = Math.floor(deltaT / F)

    if (droppedFrames) {
      let droppedValue = {
        deltaX: deltaX / (droppedFrames + 1),
        deltaY: deltaY / (droppedFrames + 1),
        deltaT: F,
      }
      droppedValue.velocityX = deltaX / t
      droppedValue.velocityY = deltaY / t

      // Subtract dropped frames' time deltas from the original time delta
      // to get the time deltas for just the latest frame.
      deltaT = deltaT - droppedValue.deltaT * droppedFrames
      t = deltaT / 1000

      // Apply the dropped frame deltas to the destination.
      for (let i = 0; i < droppedFrames; i++) {
        droppedValue = updater.computeNext(droppedValue)
        updater.catchFrame(droppedValue)
        // Subtract dropped frames' deltas from the original deltas
        // to get the deltas for just the latest frame. We do this in the loop
        // instead of outside of it because the updater may adjust the values
        // on each iteration.
        deltaX -= droppedValue.deltaX
        deltaY -= droppedValue.deltaY
      }
    }

    let newValue = {
      deltaX,
      deltaY,
      deltaT,
      velocityX: deltaX / t,
      velocityY: deltaY / t,
    }

    time = now
    lastValue = updater.computeNext(newValue)
    updater.updateFrame(lastValue)

    yield lastValue
  }
}
