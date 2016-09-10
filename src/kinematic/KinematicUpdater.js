import Updater from './Updater'

export class KinematicUpdater extends Updater {
  _init (springs = [], ...args) {
    this.springs = springs
    for (const spring of this.springs) {
      this._initSpring(spring, ...args)
    }
  }

  _clone (target) {
    target.springs = []
    for (const spring of this.springs) {
      target.springs.push(this._cloneSpring(spring))
    }
    return target
  }

  _start (value) {
    for (const spring of this.springs) {
      this._startSpring(spring)
    }
  }

  _stop (value) {
    for (const spring of this.springs) {
      this._stopSpring(spring)
    }
  }

  _computeNext (value) {
    for (const spring of this.springs) {
      value = this._computeNextSpring(value, spring)
    }
    return value
  }

  _shouldGenerateNext () {
    for (const spring of this.springs) {
      if (this._shouldGenerateNextSpring(spring)) return true
    }
    return false
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

  _cloneSpring (spring) { return {...spring} }

  _startSpring (spring) { /* noop */ }

  _stopSpring (spring) { /* noop */ }

  _shouldGenerateNextSpring (spring) { return false }

  _computeNextSpring (value, spring) { return value }

  _catchFrameSpring (value, spring) { /* noop */ }

  _updateFrameSpring (value, spring) { /* noop */ }
}

export default KinematicUpdater
