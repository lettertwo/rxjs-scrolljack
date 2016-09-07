const F = 1000 / 60  // Default frame rate

export class KinematicUpdater {
  constructor (springs) {
    this.springs = springs
    this.stopped = true
    // this.shouldComplete = false
    this.springs.forEach(this.__doInit)
  }

  start (value) {
    this.stopped = false
    this.springs.forEach(this.__doStart)
    return this.computeNext(value)
  }

  stop (value) {
    this.stopped = true
    this.springs.forEach(this.__doStop)
    return this.computeNext(value)
  }

  computeNext = value => {
    return this.springs.reduce(this.__reduceNext, value)
  }

  shouldGenerateNext () {
    return this.springs.some(this.__doShouldGenerateNext)
  }

  generateNext = function * (lastValue, time) {
    while (this.shouldGenerateNext()) {
      let {
        deltaX = 0,
        deltaY = 0,
      } = lastValue

      // TODO: How to get now from scheduler?
      let now = Date.now()
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

      if (droppedFrames) {
        const droppedValue = {
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
          this.catchFrame(droppedValue)
        }
      }

      time = now
      lastValue = this.computeNext({deltaX, deltaY, deltaT})

      yield lastValue
    }
  }

  catchFrame (value) {
    // HACK: using reduce for a side effect. Gross!
    this.springs.reduce(this.__reduceCaughtFrame, value)
  }

  _init (spring) {
  }

  _start (spring) {
  }

  _stop (spring) {
  }

  _shouldGenerateNext (spring) {
    return false
  }

  _computeNext (value, spring) {
    return value
  }

  _catchFrame (value, spring) {
    return this._computeNext(value, spring)
  }

  __doInit = spring => {
    this._init(spring)
  }

  __doStart = spring => {
    this._start(spring)
  }

  __doStop = spring => {
    this._stop(spring)
  }

  __doShouldGenerateNext = spring => {
    return this._shouldGenerateNext(spring)
  }

  __reduceNext = (value, spring) => {
    return this._computeNext(value, spring)
  }

  __reduceCaughtFrame = (value, spring) => {
    return this._catchFrame(value, spring)
  }
}

export default KinematicUpdater
