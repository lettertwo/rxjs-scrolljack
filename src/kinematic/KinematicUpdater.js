export class KinematicUpdater {
  constructor (springs, destination) {
    if (destination) this.setDestination(destination)
    this.springs = springs
    this.stopped = true
    this.shouldComplete = false
    this.springs.forEach(this.__doInit)
  }

  setDestination (destination) {
    this.destination = destination
  }

  start () {
    this.springs.forEach(this.__doStart)
    this.stopped = false
  }

  stop () {
    this.springs.forEach(this.__doStop)
    this.stopped = true
  }

  shouldScheduleNext () {
    return this.springs.some(this.__doShouldScheduleNext)
  }

  update (value) {
    const nv = this.springs.reduce(this.__reduceValue, value)
    this.destination.next(nv)
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

  _shouldScheduleNext (spring) {
    return false
  }

  _update (value, spring) {
    return value
  }

  _catchFrame (value, spring) {
    return this._update(value, spring)
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

  __doShouldScheduleNext = spring => {
    return this._shouldScheduleNext(spring)
  }

  __reduceValue = (value, spring) => {
    return this._update(value, spring)
  }

  __reduceCaughtFrame = (value, spring) => {
    return this._catchFrame(value, spring)
  }
}

export default KinematicUpdater
