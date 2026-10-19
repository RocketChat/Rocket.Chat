import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { usePagination } from './usePagination';

it('should go back to the first page when the reset key changes', () => {
	const { result, rerender } = renderHook(({ resetKey }) => usePagination({ resetKey }), {
		wrapper: mockAppRoot().build(),
		initialProps: { resetKey: ['sounds', { text: '' }] },
	});

	act(() => result.current.setCurrent(50));
	expect(result.current.current).toBe(50);

	rerender({ resetKey: ['sounds', { text: 'filter' }] });

	expect(result.current.current).toBe(0);
});
