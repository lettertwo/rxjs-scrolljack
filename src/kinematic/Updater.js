/**
 * The base Updater class.
 * Doesn't really *do* anything on its own,
 * but subclasses can extend the underscored methods to
 * 'hook' into the update lifecycle.
 */

export class Updater {
  constructor (...args) {
    this.stopped = true
    this._init(...args)
  }

  start (value) {
    this.stopped = false
    this._start(value)
    return this.computeNext(value)
  }

  stop (value) {
    this.stopped = true
    this._stop(value)
    return this.computeNext(value)
  }

  computeNext (value) {
    return this._computeNext(value)
  }

  shouldGenerateNext () {
    return this._shouldGenerateNext()
  }

  updateFrame (value) {
    this._updateFrame(value)
  }

  catchFrame (value) {
    this._catchFrame(value)
  }

  _init () { /* noop */ }

  _start (value) { /* noop */ }

  _stop (value) { /* noop */ }

  _computeNext (value) { return value }

  _shouldGenerateNext () { return false }

  _updateFrame (value) { /* noop */ }

  _catchFrame (value) { /* noop */ }
}

export default Updater
