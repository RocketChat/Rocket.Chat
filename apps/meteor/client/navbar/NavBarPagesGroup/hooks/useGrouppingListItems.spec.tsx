import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useGroupingListItems } from './useGroupingListItems';

it('should render all groupingList items', async () => {
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

it('should render only unread and types groupingList items if secondarySidebar is enabled', async () => {
	const { result } = renderHook(() => useGroupingListItems(), {
		wrapper: mockAppRoot()
			.withSetting('Accounts_AllowFeaturePreview', true)
			.withUserPreference('featuresPreview', [{ name: 'secondarySidebar', value: true }])
			.build(),
	});

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'unread',
		}),
	);

	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'types',
		}),
	);
});
