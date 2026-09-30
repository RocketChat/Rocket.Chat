import { renderHook } from '@testing-library/react';

import { createRequiredContext } from './createRequiredContext';

const [NumberProvider, useNumber] = createRequiredContext<number>('NumberContext');

it('returns the value of the nearest provider', () => {
	const { result } = renderHook(() => useNumber(), {
		wrapper: ({ children }) => <NumberProvider value={42}>{children}</NumberProvider>,
	});

	expect(result.current).toBe(42);
});

it('accepts falsy values other than undefined', () => {
	const { result } = renderHook(() => useNumber(), {
		wrapper: ({ children }) => <NumberProvider value={0}>{children}</NumberProvider>,
	});

	expect(result.current).toBe(0);
});

it('throws when read outside a provider', () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);

	expect(() => renderHook(() => useNumber())).toThrow('NumberContext is not available');
});
