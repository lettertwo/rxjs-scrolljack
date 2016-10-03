import Updater from './Updater'
import {hasDelta} from '../utils'

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
    if (!hasDelta(value)) return
    for (const spring of this.springs) {
      this._updateFrameSpring(value, spring)
    }
  }

  _catchFrame (value) {
    if (!hasDelta(value)) return
    for (const spring of this.springs) {
      this._catchFrameSpring(value, spring)
    }
  }

  _initSpring (spring) { /* noop */ }

  _cloneSpring (spring) { return {...spring} }

  _shouldGenerateNextSpring (spring) { return false }

  _computeNextSpring (value, spring) { return value }

  _catchFrameSpring (value, spring) { /* noop */ }

  _updateFrameSpring (value, spring) { /* noop */ }
}

export default KinematicUpdater
