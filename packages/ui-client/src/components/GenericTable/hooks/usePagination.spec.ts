import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { usePagination } from './usePagination';

it('should go back to the first page when a resetOn value changes', () => {
	const { result, rerender } = renderHook(({ text }) => usePagination({ resetOn: [text] }), {
		initialProps: { text: 'a' },
		wrapper: mockAppRoot().build(),
	});

	act(() => result.current.setCurrent(50));
	rerender({ text: 'a' });

	expect(result.current.current).toBe(50);

	rerender({ text: 'b' });

	expect(result.current.current).toBe(0);
});

it('should go back to the first page when the page size changes', () => {
	const { result } = renderHook(() => usePagination(), { wrapper: mockAppRoot().build() });

	act(() => result.current.setCurrent(50));
	act(() => result.current.setItemsPerPage(50));

	expect(result.current.itemsPerPage).toBe(50);
	expect(result.current.current).toBe(0);
});
