# Hooks that touch the DOM

A hook that attaches behavior to a DOM node — a listener, an observer, a keybinding — **returns a callback ref**. It does not take a `RefObject`.

```ts
// ✅ the hook owns the binding and hands back a ref
const ref = usePreventDefault();
return <Box ref={ref} />;

// ❌ the caller owns a ref and lends it to the hook
const ref = useRef<HTMLElement>(null);
usePreventDefault(ref);
return <Box ref={ref} />;
```

## Why

The `ref`-taking shape forces the hook to bind from an effect, and the only dependency available is the ref object itself:

```ts
export const usePreventDefault = (ref: RefObject<Element | null>) => {
	useEffect(() => {
		const { current } = ref;
		current?.addEventListener('click', stopPropagation);
		return () => current?.removeEventListener('click', stopPropagation);
	}, [ref]); // ⚠️ `ref` is stable for the lifetime of the component
};
```

A `RefObject`'s identity never changes, so `[ref]` never invalidates. When React swaps the underlying element — a conditional branch, a key change, a list reorder — the effect does not re-run. The listener stays on the old, detached node and the new one is never wired up. Nothing throws; the feature just silently stops working.

The effect also runs one commit _after_ the ref is populated, so the hook has to cope with `current` being `null`, which is where casts like `ref.current as HTMLElement` come from.

A callback ref removes both problems by construction: React calls it with the node itself, every time the node changes. The binding follows the element instead of the container that happens to hold it.

## The shape

Build the callback ref with `useSafeRefCallback` from `@rocket.chat/fuselage-hooks`, wrapping a `useCallback`. Create the resource inside, and return its teardown:

```ts
import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

export const usePreventDefault = (): RefCallback<HTMLElement> =>
	useSafeRefCallback(
		useCallback((node: HTMLElement) => {
			const stopPropagation: EventListener = (e) => {
				/* … */
			};

			node.addEventListener('click', stopPropagation);

			return () => node.removeEventListener('click', stopPropagation);
		}, []),
	);
```

There is **no `useEffect`**. The listener is registered when the node is assigned and released from the cleanup, so it exists exactly as long as the element does. There is also no internal ref holding the node and no `null` check — the node arrives as an argument and is never `null` inside the callback.

Keep the callback's dependencies stable, since each new identity re-runs the teardown and binds again. Wrap incoming callbacks in `useStableCallback` rather than listing them as dependencies.

## Handle `null`, do not return a cleanup to React

React 19 lets a ref callback return its own cleanup function. **Do not rely on that here.** `useMergedRefs` does not forward the value a merged ref returns, so a cleanup written in that style is silently dropped whenever the ref is combined with another one.

`useSafeRefCallback` uses the other convention: it stores the cleanup itself and runs it when React calls the ref with `null`. `useMergedRefs` does propagate `null`, so hooks built this way compose correctly. That is the whole reason to prefer it.

## Combining refs at the call site

When several hooks need the same element, or the element is also needed as an object ref, merge at the call site with `useMergedRefs`:

```tsx
const preventDefaultRef = usePreventDefault();
const shortcutOpenMenuRef = useShortcutOpenMenu();
const ref = useMergedRefs(resizeObserverRef, preventDefaultRef, shortcutOpenMenuRef);

return <Box ref={ref} />;
```

A hook must not accept a ref just to write the node into it — that is the call site's job, and doing it in both places duplicates the same assignment.

## Reference implementation

`client/views/room/hooks/useIsVisible.ts` is the canonical example: it takes no argument, returns `[ref, isVisible]` as a tuple, creates its `IntersectionObserver` inside the callback and disconnects it in the cleanup, and states its return type without a cast.

## When this does not apply

Not every hook that receives a ref is a candidate.

- **Refs used as shared mutable state.** A `MutableRefObject<boolean>` passed between hooks to track scroll position, or a `virtua` imperative handle, is not a DOM handle. Callback refs have nothing to offer there; leave those signatures alone.
- **Hooks that need the element during render.** Measurement and positioning hooks derive a value that the same render consumes. Turning those into callback refs means holding the node in state and paying an extra render, which is a different trade-off from the one described here.
