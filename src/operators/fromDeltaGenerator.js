import {from} from 'rxjs/observable/from'
import {animationFrame} from 'rxjs/scheduler/animationFrame'

const F = 1000 / 60  // Default frame rate

export const fromDeltaGenerator = (initialValue, updater, scheduler = animationFrame) => {
  return from(
    createDeltaGenerator(scheduler, updater, initialValue, scheduler.now()),
    scheduler,
  )
}

export default fromDeltaGenerator

export function * createDeltaGenerator (scheduler, updater, lastValue, time) {
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
      droppedValue.velocityX = deltaX / deltaT
      droppedValue.velocityY = deltaY / deltaT

      // Subtract dropped frames' time deltas from the original time delta
      // to get the time deltas for just the latest frame.
      deltaT = deltaT - droppedValue.deltaT * droppedFrames

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
      velocityX: deltaX / deltaT,
      velocityY: deltaY / deltaT,
    }

    time = now
    lastValue = updater.computeNext(newValue)
    updater.updateFrame(lastValue)

    yield lastValue
  }
}
