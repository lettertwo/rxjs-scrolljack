import {fromEvent} from 'rxjs/observable/fromEvent'
import {filter} from 'rxjs/operator/filter'
import {_do as tap} from 'rxjs/operator/do'
import {preventDefault} from '../utils'

export const fromHijackedEvent = (el, type, predicate) => {
  let events = fromEvent(el, type)
  if (predicate) events = events::filter(predicate)
  return events::tap(preventDefault)
}
