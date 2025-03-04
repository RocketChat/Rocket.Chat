import { renderHook } from '@testing-library/react';

import { useViewModeItems } from './useViewModeItems';

it('should render viewMode items', async () => {
	const { result } = renderHook(() => useViewModeItems());

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'extended',
		}),
	);

	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'medium',
		}),
	);

	expect(result.current[2]).toEqual(
		expect.objectContaining({
			id: 'condensed',
		}),
	);

	expect(result.current[3]).toEqual(
		expect.objectContaining({
			id: 'avatars',
		}),
	);
});
