import {KinematicUpdater} from './KinematicUpdater'
import {computeNextValue} from './computeNextValue'
import {parseXOpts, parseYOpts} from './parseOpts'

class AnchorUpdater extends KinematicUpdater {
  _initSpring (spring, initialValue) {
    if (initialValue) {
      spring.netDelta = spring.toDelta(initialValue)
      spring.lastVelocity = spring.toVelocity(initialValue)
    } else {
      spring.lastVelocity = 0
      spring.netDelta = 0
    }
  }

  _computeNextSpring (value, spring) {
    const t = value.deltaT / 1000
    const {netDelta, stiffness: K, damping: B, precision: P} = spring
    const delta = spring.toDelta(value)
    const velocity = spring.toVelocity(value)

    let newNetDelta
    if (!this.stopped) {
      newNetDelta = netDelta + delta
    } else {
      newNetDelta = netDelta
    }

    // Compute the result of the current frame.
    const [nnd, nv] = computeNextValue(newNetDelta, 0, velocity, t, K, B, P)

    spring.netDelta = nnd
    spring.lastVelocity = nv

    return {
      ...value,
      ...spring.fromDelta(nnd - netDelta),
      ...spring.fromVelocity(nv),
    }
  }

  _shouldGenerateNextSpring (spring) {
    return spring.lastVelocity !== 0 || spring.netDelta !== 0
  }
}

export const anchorX = (opts, ...args) =>
  new AnchorUpdater([parseXOpts(opts)], ...args)

export const anchorY = (opts, ...args) =>
  new AnchorUpdater([parseYOpts(opts)], ...args)

export const anchor = (opts, ...args) =>
  new AnchorUpdater([parseXOpts(opts), parseYOpts(opts)], ...args)

anchor.x = anchorX
anchor.y = anchorY

export default anchor
