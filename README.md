rxjs-scrolljack
===============

Reactive utilities for rolling your own scrolling.

Usage
-----

```javascript
import Rx from 'rxjs';
import {Wheel} from 'rxjs-scrolljack';

Wheel.start(window)
  .switchMap(startDelta => Wheel.move(window)
    .takeUntil(Wheel.stop(window))
    .momentum(/* {stiffness: 170, damping: 26} */)
  )
  .subscribe(value => {
    const maxX = document.body.scrollWidth - window.innerWidth;
    const maxY = document.body.scrollHeight - window.innerHeight;
    const newX = window.scrollX + value.deltaX
    const newY = window.scrollY + value.deltaY
    window.scrollTo(
      Math.max(0, Math.min(maxX, newX)),
      Math.max(0, Math.min(maxY, newY)),
    );
  });
```
