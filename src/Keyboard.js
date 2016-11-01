import $$observable from 'symbol-observable'
import {DeltaObservable} from './observables/DeltaObservable'
import {DeltaOperator} from './operators/DeltaOperator'
import {EmulatedKeyboardEventObservable} from './observables/EmulatedKeyboardEventObservable'
import {KEY_START, KEY_MOVE, KEY_END} from './events'

export class Keyboard extends DeltaObservable {
  constructor (target, event = KEY_MOVE) {
    if (typeof target[$$observable] === 'function') {
      super(target)
    } else {
      const source = EmulatedKeyboardEventObservable.create(target, event, ignoreUnmappedKeys)
      source.operator = new DeltaOperator(keyCodeToScrollDelta, keyCodeToScrollVelocity)
      super(source)
    }
  }

  static scrollStart (target) {
    return super.scrollStart(target, KEY_START)
  }

  static stop (target) {
    return super.stop(target, KEY_END)
  }
}

export default Keyboard

const LINE_DELTA = 40
const PAGE_DELTA = 583

const CODES = [
  'Space',
  'PageUp',
  'PageDown',
  'End',
  'Home',
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
]

const KEY_CODES_2_CODES = {
  32: 'Space',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
}

const keyCodeToScrollVelocity = (event, lastEvent, deltaT) => {
  let velocityX
  let velocityY

  if (!lastEvent) {
    velocityX = 0
    velocityY = 0
  } else {
    const {deltaX, deltaY} = keyCodeToScrollDelta(event)
    const t = deltaT / 1000
    velocityX = deltaX / t
    velocityY = deltaY / t
  }

  return {velocityX, velocityY}
}

const keyCodeToScrollDelta = ({code, keyCode}) => {
  if (!code) code = KEY_CODES_2_CODES[keyCode]
  switch (code) {
    case 'PageUp':
    case 'Home':
      return {deltaX: 0, deltaY: -PAGE_DELTA}
    case 'Space':
    case 'PageDown':
    case 'End':
      return {deltaX: 0, deltaY: PAGE_DELTA}
    case 'ArrowUp':
      return {deltaX: 0, deltaY: -LINE_DELTA}
    case 'ArrowDown':
      return {deltaX: 0, deltaY: LINE_DELTA}
    case 'ArrowLeft':
      return {deltaX: -LINE_DELTA, deltaY: 0}
    case 'ArrowRight':
      return {deltaX: LINE_DELTA, deltaY: 0}
  }
}

const ignoreUnmappedKeys = ({code, keyCode, ctrlKey, shiftKey, altKey, metaKey}) => {
  if (ctrlKey || shiftKey || altKey || metaKey) return false
  if (!code) code = KEY_CODES_2_CODES[keyCode]
  if (!CODES.includes(code)) return false
  return true
}
