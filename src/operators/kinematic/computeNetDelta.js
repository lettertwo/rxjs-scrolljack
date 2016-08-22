// If we just reuse the same array wrapper for each computation, we can save
// an allocation. The caveat is that return values inside the array need to be
// immediately destructured by the caller, rather than keeping a reference
// to the array.
let computedNext = []

// A mass-spring-damper system directly inspired by (stolen from) react-motion.
export const computeNetDelta = (netDelta, velocity, time, stiffness, damping, precision) => {
  // Calculate the acceleration due to net forces from
  // current velocity plus the restorative spring force.
  const spring = -stiffness * netDelta
  const damper = -damping * velocity
  const a = spring + damper

  // Calculate the actual velocity and offset after net forces have been applied.
  let newVelocity = velocity + a * time
  let newNetDelta = netDelta + newVelocity * time

  // Round our value to PRECISION.
  if (Math.abs(newVelocity) < precision && Math.abs(newNetDelta) < precision) {
    newNetDelta = 0
    newVelocity = 0
  }

  // Return the new net delta and the new velocity.
  computedNext[0] = newNetDelta
  computedNext[1] = newVelocity

  return computedNext
}

export const computeMinNetDelta = (minDelta, netDelta, velocity, ...args) => {
  let next = computeNetDelta(netDelta, velocity, ...args)
  let newDelta = next[0] - netDelta

  if (Math.abs(newDelta) > Math.abs(minDelta)) {
    newDelta = minDelta
    next[0] = netDelta + newDelta
    next[1] = velocity
  }

  // Return the new net delta and the new velocity.
  return next
}
