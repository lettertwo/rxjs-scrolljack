import {isCollection} from 'iterall'

const K = 170  // Default stiffness
const B = 26  //  Default damping
const P = 0.01  // Default precision

const toDeltaFromDeltaX = ({deltaX}) => deltaX
const toDeltaXFromDelta = delta => ({deltaX: delta})

const toDeltaFromDeltaY = ({deltaY}) => deltaY
const toDeltaYFromDelta = delta => ({deltaY: delta})

const toVelocityFromVelocityX = ({velocityX}) => velocityX
const toVelocityXFromVelocity = velocity => ({velocityX: velocity})

const toVelocityFromVelocityY = ({velocityY}) => velocityY
const toVelocityYFromVelocity = velocity => ({velocityY: velocity})

export const parseOpts = optsLike => {
  if (typeof optsLike.toDelta !== 'function') {
    throw new Error('A `toDelta` option is required.')
  }

  if (typeof optsLike.fromDelta !== 'function') {
    throw new Error('A `fromDelta` option is required.')
  }

  if (typeof optsLike.toVelocity !== 'function') {
    throw new Error('A `toVelocity` option is required.')
  }

  if (typeof optsLike.fromVelocity !== 'function') {
    throw new Error('A `fromVelocity` option is required.')
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
  toVelocity: toVelocityFromVelocityX,
  fromVelocity: toVelocityXFromVelocity,
  ...opts,
})

export const parseYOpts = opts => parseOpts({
  toDelta: toDeltaFromDeltaY,
  fromDelta: toDeltaYFromDelta,
  toVelocity: toVelocityFromVelocityY,
  fromVelocity: toVelocityYFromVelocity,
  ...opts,
})

export const parseBoundsOpts = optsLike => {
  if (optsLike.min == null) {
    throw new Error('A `min` option is required.')
  }

  if (optsLike.max == null) {
    throw new Error('A `max` option is required.')
  }

  return optsLike
}

export const parseBoundsXOpts = opts => parseBoundsOpts({
  min: opts.x || 0,
  max: opts.width || 0,
  ...parseXOpts(opts),
})

export const parseBoundsYOpts = opts => parseBoundsOpts({
  min: opts.y || 0,
  max: opts.height || 0,
  ...parseYOpts(opts),
})
