# @rocket.chat/patch-injection

Function-level patch/hook system for the CE / EE split.

## CE / EE hook pattern

Do **not** roll ad-hoc hook registries. Use this package instead:

```ts
// CE side
import { makeFunction } from '@rocket.chat/patch-injection';
export const doX = makeFunction((arg: A): B => { /* default */ });

// EE side (only loaded w/ license active)
doX.patch((next, arg) => { /* override or wrap next(arg) */ });
```

Patches stack, run in order; pass `condition` for license/feature gates.
