const K = 120  // stiffness
const B = 26  //  damping
const P = 0.001  // precision

export const velocity = (d, t) => { return t ? d / t : 0 }

// A mass-spring-damper system directly inspired by (stolen from) react-motion.
export const dampedVelocity = (x, v, t, stiffness = K, damping = B) => {
  const spring = -stiffness * x
  const damper = -damping * v
  const a = spring + damper
  return v + a * t
}

export const displacement = (x, v, t, precision = P) => {
  let nx = x + v * t
  if (Math.abs(v) < precision && Math.abs(nx) < precision) {
    nx = 0
  }
  return nx
}
