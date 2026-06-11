import { renderHook } from '@testing-library/react';

import { useGroupingListItems } from './useGroupingListItems';

it('should render groupingList items', async () => {
	const { result } = renderHook(() => useGroupingListItems());

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'unread',
		}),
	);

	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'favorites',
		}),
	);

	expect(result.current[2]).toEqual(
		expect.objectContaining({
			id: 'types',
		}),
	);
});
