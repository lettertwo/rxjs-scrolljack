// If we just reuse the same array wrapper for each computation, we can save
// an allocation. The caveat is that return values inside the array need to be
// immediately destructured by the caller, rather than keeping a reference
// to the array.
let computedNext = []

// A mass-spring-damper system directly inspired by (stolen from) react-motion.
export const computeNextValue = (value, endValue, velocity, time, stiffness, damping, precision) => {
  // Calculate the acceleration due to net forces from
  // current velocity plus the restorative spring force.
  const spring = -stiffness * (value - endValue)
  const damper = -damping * velocity
  const a = spring + damper

  // Calculate the actual velocity and offset after net forces have been applied.
  let newVelocity = velocity + a * time
  let newValue = value + newVelocity * time

  // Round our value to PRECISION.
  if (Math.abs(newVelocity) < precision && Math.abs(newValue - endValue) < precision) {
    newValue = endValue
    newVelocity = 0
  }

  // Return the new net delta and the new velocity.
  computedNext[0] = newValue
  computedNext[1] = newVelocity

  return computedNext
}
