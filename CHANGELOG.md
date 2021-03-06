## 1.0.0

* Add support for native scroll input
* Make native scroll input the default Scrolljack input
* Allow Scrolljack.scrollStart to take a closingSelector arg
* Allow Scrolljack.scrollStop to take an openings Observable
* Add Scrolljack.scrollWindow openings and closingSelector args

## 0.4.0

* Sync multiple kinematic operators with a latest value source
* Bump rxjs@5.0.0-rc.2
* Snapshot touch events in delta operator

## 0.3.2

* Fix emulation of default event types
* Use start/stop events as start/stop values
* Add default timeout to mouse and touch starts

## 0.3.1

* Improve anchored input behavior

## 0.3.0

* Make anchor less volatile while receiving input
* Emulate and normalize events
* Pool emulated event sources

## 0.2.0

* Add Scrolljack.scrollWindow higher-order operator
* Rename Scrolljack.move operator to scroll
* Rename Scrolljack.moveTo operator to scrollTo
* Rename Scrolljack.stop operator to scrollStop
* Rename Scrolljack.start operator to scrollStart
* Add Scrolljack.merge operator
* Remove touchpad detection from wheel event operator

## 0.1.0

* :construction: Initial release!
