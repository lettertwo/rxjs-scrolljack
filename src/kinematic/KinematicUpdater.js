import Updater from './Updater'

export class KinematicUpdater extends Updater {
  _init (springs) {
    this.springs = springs
    this.springs.forEach(this._initSpring)
  }

  _start (value) {
    this.springs.forEach(this._startSpring)
  }

  _stop (value) {
    this.springs.forEach(this._stopSpring)
  }

  _computeNext (value) {
    if (!value.deltaT && !value.deltaX && !value.deltaY) return value
    return this.springs.reduce(this._reduceNext, value)
  }

  _shouldGenerateNext () {
    return this.springs.some(this._shouldGenerateNextSpring)
  }

  _updateFrame (value) {
    if (!value.deltaT && !value.deltaX && !value.deltaY) return
    for (const spring of this.springs) {
      this._updateFrameSpring(value, spring)
    }
  }

  _catchFrame (value) {
    if (!value.deltaT && !value.deltaX && !value.deltaY) return
    for (const spring of this.springs) {
      this._catchFrameSpring(value, spring)
    }
  }

  _initSpring (spring) { /* noop */ }

  _startSpring (spring) { /* noop */ }

  _stopSpring (spring) { /* noop */ }

  _shouldGenerateNextSpring (spring) { return false }

  _reduceNext = (value, spring) => {
    return this._computeNextSpring(value, spring)
  }

  _computeNextSpring (value, spring) { return value }

  _catchFrameSpring (value, spring) { /* noop */ }

  _updateFrameSpring (value, spring) { /* noop */ }
}

export default KinematicUpdater
