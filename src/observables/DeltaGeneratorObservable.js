import {Observable} from 'rxjs/Observable'
import {BehaviorSubject} from 'rxjs/BehaviorSubject'
import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {observeOn} from 'rxjs/operator/observeOn'
import {withLatestFrom} from 'rxjs/operator/withLatestFrom'
import {map} from 'rxjs/operator/map'
import {GenerateObservable} from 'rxjs/observable/GenerateObservable'
import {_do as tap} from 'rxjs/operator/do'
import {takeWhile} from 'rxjs/operator/takeWhile'
import {anchor} from '../updaters/anchor'
import {isDeltaLike} from '../utils'

export class DeltaGeneratorObservable extends Observable {
  constructor (latestSourceOrStartValue, endValue, updater, scheduler) {
    super()
    this.updater = updater
    this.scheduler = scheduler
    this.endValue = endValue

    let latestSource = latestSourceOrStartValue
    let startValue

    if (isDeltaLike(latestSource)) {
      startValue = latestSource
      latestSource = null
    }

    this.latestSource = latestSource
    this.startValue = startValue
  }

  _subscribe (subscriber) {
    let {startValue, endValue, latestSource, updater, scheduler} = this
    if (typeof updater === 'function') updater = updater()

    if (endValue && startValue) {
      // We subtract our target delta from the updater's net delta so that
      // it ends up generating that amount of delta in the original orientation
      // as it attempts to bring the netDelta back to 0.
      updater.updateFrame({
        ...endValue,
        deltaX: startValue.deltaX - endValue.deltaX,
        deltaY: startValue.deltaY - endValue.deltaY,
      })
    }

    return DeltaGeneratorObservable.from(updater, scheduler, latestSource || startValue)
      ._subscribe(subscriber)
  }

  static create (latestSourceOrStartValue, endValue, updater = anchor, scheduler = animationFrame) {
    return new DeltaGeneratorObservable(latestSourceOrStartValue, endValue, updater, scheduler)
  }

  static from (updater = anchor, scheduler = animationFrame, latestSourceOrInitialValue) {
    let latestSource = latestSourceOrInitialValue
    let initialValue
    let selector

    if (isDeltaLike(latestSource)) {
      initialValue = latestSource
      latestSource = null
      selector = createSelector(updater)
    } else {
      initialValue = {deltaX: 0, deltaY: 0}
      selector = createSelector()
    }

    const condition = createCondition(updater)
    const iterator = createIterator(updater, scheduler)
    if (latestSource) {
      let timeStamps = new BehaviorSubject(scheduler.now())
      return latestSource
      ::withLatestFrom(timeStamps)
      ::takeWhile(condition)
      ::observeOn(scheduler)
      ::map(iterator)
      ::tap(([, time]) => timeStamps.next(time))
      ::map(selector)
    } else {
      return GenerateObservable.create(
        [initialValue, scheduler.now()],
        condition,
        iterator,
        selector,
        scheduler,
      )
    }
  }
}

export default DeltaGeneratorObservable

const F = 1000 / 60  // Default frame rate

const createCondition = updater => () => updater.shouldGenerateNext()

const createIterator = (updater, scheduler) => ([lastValue, time]) => {
  let {deltaX, deltaY, velocityX = 0, velocityY = 0} = lastValue
  let now = scheduler.now()
  let deltaT = now - time

  // If it seems like we've dropped a lot of frames, its probably because
  // this process was backgrounded (switched tabs), so we should restart.
  if (deltaT > F * 10) {
    deltaT = F
  }

  let newLastValue = {
    deltaX,
    deltaY,
    deltaT,
    velocityX,
    velocityY,
  }

  return [updater.computeNext(newLastValue), now]
}

const createSelector = updater => ([lastValue]) => {
  if (updater) updater.updateFrame(lastValue)
  return lastValue
}
