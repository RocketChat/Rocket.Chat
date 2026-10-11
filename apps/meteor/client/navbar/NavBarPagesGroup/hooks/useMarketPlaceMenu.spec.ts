import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useMarketPlaceMenu } from './useMarketPlaceMenu';

it('should return and empty array if the user does not have `manage-apps` and `access-marketplace` permission', () => {
	const { result } = renderHook(() => useMarketPlaceMenu(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/apps/actionButtons', () => [])
			.build(),
	});

	expect(result.current[0].items).toEqual([]);
});

it('should return `explore` and `installed` items if the user has `access-marketplace` permission', () => {
	const { result } = renderHook(() => useMarketPlaceMenu(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/apps/actionButtons', () => [])
			.withPermission('access-marketplace')
			.build(),
	});

	expect(result.current[0].items[0]).toEqual(
		expect.objectContaining({
			id: 'explore',
		}),
	);

	expect(result.current[0].items[1]).toEqual(
		expect.objectContaining({
			id: 'installed',
		}),
	);
});

it('should return `explore`, `installed` and `requested` items if the user has `manage-apps` permission', () => {
	const { result } = renderHook(() => useMarketPlaceMenu(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/apps/actionButtons', () => [])
			.withEndpoint('GET', '/apps/app-request/stats', () => ({
				data: {
					totalSeen: 0,
					totalUnseen: 1,
				},
			}))
			.withPermission('manage-apps')
			.build(),
	});

	expect(result.current[0].items[0]).toEqual(
		expect.objectContaining({
			id: 'explore',
		}),
	);

	expect(result.current[0].items[1]).toEqual(
		expect.objectContaining({
			id: 'installed',
		}),
	);

	expect(result.current[0].items[2]).toEqual(
		expect.objectContaining({
			id: 'requested-apps',
		}),
	);
});
