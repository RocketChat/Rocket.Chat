import { renderHook } from '@testing-library/react';

import { useSortModeItems } from './useSortModeItems';

it('should render sortMode items', async () => {
	const { result } = renderHook(() => useSortModeItems());

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'activity',
		}),
	);

	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'name',
		}),
	);
});
