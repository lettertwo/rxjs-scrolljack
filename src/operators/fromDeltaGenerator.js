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
