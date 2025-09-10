import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useSortQueryOptions } from './useSortQueryOptions';

it("should return query option to sort by last message when user preference is 'activity'", () => {
	const { result } = renderHook(() => useSortQueryOptions(), {
		wrapper: mockAppRoot().withUserPreference('sidebarSortby', 'activity').build(),
	});
	expect(result.current.sort).toHaveProperty('lm', -1);
});

it("should return query option to sort by name when user preference is 'name'", () => {
	const { result } = renderHook(() => useSortQueryOptions(), {
		wrapper: mockAppRoot().withUserPreference('sidebarSortby', 'name').build(),
	});
	expect(result.current.sort).toHaveProperty('lowerCaseName', 1);
});

it("should return query option to sort by fname when user preference is 'name' and showRealName is true", () => {
	const { result } = renderHook(() => useSortQueryOptions(), {
		wrapper: mockAppRoot().withUserPreference('sidebarSortby', 'name').withSetting('UI_Use_Real_Name', true).build(),
	});
	expect(result.current.sort).toHaveProperty('lowerCaseFName', 1);
});
