import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { usePagination } from './usePagination';

it('should reset to the first page when the reset key changes', () => {
	const { result, rerender } = renderHook(({ resetKey }) => usePagination(resetKey), {
		wrapper: mockAppRoot().build(),
		initialProps: { resetKey: 'initial' },
	});

	act(() => {
		result.current.setCurrent(3);
	});
	expect(result.current.current).toBe(3);

	rerender({ resetKey: 'changed' });

	expect(result.current.current).toBe(0);
});

it('should keep the current page when the reset key does not change', () => {
	const { result, rerender } = renderHook(({ resetKey }) => usePagination(resetKey), {
		wrapper: mockAppRoot().build(),
		initialProps: { resetKey: 'same' },
	});

	act(() => {
		result.current.setCurrent(2);
	});
	expect(result.current.current).toBe(2);

	rerender({ resetKey: 'same' });

	expect(result.current.current).toBe(2);
});
