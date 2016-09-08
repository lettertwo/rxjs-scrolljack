export class KinematicUpdater {
  constructor (springs) {
    this.springs = springs
    this.stopped = true
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
    if (!value.deltaT && !value.deltaX && !value.deltaY) return value
    return this.springs.reduce(this.__reduceNext, value)
  }

  shouldGenerateNext () {
    return this.springs.some(this.__doShouldGenerateNext)
  }

  updateFrame (value) {
    if (!value.deltaT && !value.deltaX && !value.deltaY) return
    for (const spring of this.springs) {
      this._updateFrame(value, spring)
    }
  }

  catchFrame (value) {
    if (!value.deltaT && !value.deltaX && !value.deltaY) return value
    for (const spring of this.springs) {
      this._catchFrame(value, spring)
    }
  }

  _init (spring) { /* noop */ }

  _start (spring) { /* noop */ }

  _stop (spring) { /* noop */ }

  _shouldGenerateNext (spring) {
    return false
  }

  _computeNext (value, spring) {
    return value
  }

  _catchFrame (value, spring) {
    this._updateFrame(value, spring)
  }

  _updateFrame (value, spring) { /* noop */ }

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
}

export default KinematicUpdater
