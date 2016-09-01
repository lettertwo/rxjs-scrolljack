import {isCollection} from 'iterall'

const K = 170  // Default stiffness
const B = 26  //  Default damping
const P = 0.01  // Default precision

const toDeltaFromDeltaX = ({deltaX}) => deltaX
const toDeltaXFromDelta = delta => ({deltaX: delta})

const toDeltaFromDeltaY = ({deltaY}) => deltaY
const toDeltaYFromDelta = delta => ({deltaY: delta})

export const parseOpts = optsLike => {
  if (typeof optsLike.toDelta !== 'function') {
    throw new Error('A `toDelta` option is required.')
  }

  if (typeof optsLike.fromDelta !== 'function') {
    throw new Error('A `fromDelta` option is required.')
  }

  return {
    stiffness: K,
    damping: B,
    precision: P,
    ...optsLike,
  }
}

export const parseOptsArray = opts => {
  if (isCollection(opts)) {
    opts = Array.from(opts)
  } else {
    opts = [opts]
  }
  return opts.map(parseOpts)
}

export const parseXOpts = opts => parseOpts({
  toDelta: toDeltaFromDeltaX,
  fromDelta: toDeltaXFromDelta,
  ...opts,
})

export const parseYOpts = opts => parseOpts({
  toDelta: toDeltaFromDeltaY,
  fromDelta: toDeltaYFromDelta,
  ...opts,
})
