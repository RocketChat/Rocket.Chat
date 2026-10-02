import { Emitter } from '@rocket.chat/emitter';
import { act, renderHook } from '@testing-library/react';

import { useEmitterValue } from './useEmitterValue';

const createCounter = () => {
	const emitter = new Emitter<{ change: void; other: void }>();
	let count = 0;

	return {
		emitter,
		getCount: () => count,
		increment: () => {
			count++;
			emitter.emit('change');
		},
	};
};

it('returns the current snapshot', () => {
	const { emitter, getCount } = createCounter();

	const { result } = renderHook(() => useEmitterValue(emitter, 'change', getCount));

	expect(result.current).toBe(0);
});

it('re-renders with the new snapshot when the event fires', () => {
	const { emitter, getCount, increment } = createCounter();

	const { result } = renderHook(() => useEmitterValue(emitter, 'change', getCount));

	act(() => increment());

	expect(result.current).toBe(1);
});

it('only listens to the given event', () => {
	const { emitter, getCount } = createCounter();
	let renders = 0;

	renderHook(() => {
		renders++;
		return useEmitterValue(emitter, 'change', getCount);
	});
	const rendersAfterMount = renders;

	act(() => emitter.emit('other'));

	expect(renders).toBe(rendersAfterMount);
});

it('stops listening on unmount', () => {
	const { emitter, getCount } = createCounter();

	const { unmount } = renderHook(() => useEmitterValue(emitter, 'change', getCount));
	expect(emitter.has('change')).toBe(true);

	unmount();

	expect(emitter.has('change')).toBe(false);
});

it('resubscribes when the emitter changes', () => {
	const first = createCounter();
	const second = createCounter();

	const { result, rerender } = renderHook(({ counter }) => useEmitterValue(counter.emitter, 'change', counter.getCount), {
		initialProps: { counter: first },
	});

	rerender({ counter: second });
	act(() => second.increment());

	expect(result.current).toBe(1);
	expect(first.emitter.has('change')).toBe(false);
});
