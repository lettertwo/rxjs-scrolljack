/**
 * The base Updater class.
 * Doesn't really *do* anything on its own,
 * but subclasses can extend the underscored methods to
 * 'hook' into the update lifecycle.
 */

export class Updater {
  constructor (...args) {
    this.stopped = true
    this.init(...args)
  }

  init (...args) {
    this._init(...args)
  }

  clone () {
    const updater = new this.constructor()
    updater.stopped = this.stopped
    return this._clone(updater)
  }

  start () {
    this.stopped = false
    this._start()
    return this.stopped === false
  }

  stop () {
    this.stopped = true
    this._stop()
    return this.stopped === true
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

  _clone (target) { return target }

  _start () { /* noop */ }

  _stop () { /* noop */ }

  _computeNext (value) { return value }

  _shouldGenerateNext () { return false }

  _updateFrame (value) { /* noop */ }

  _catchFrame (value) { /* noop */ }
}

export default Updater
