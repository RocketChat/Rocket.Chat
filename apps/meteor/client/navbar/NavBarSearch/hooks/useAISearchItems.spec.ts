import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useAISearchItems } from './useAISearchItems';

describe('useAISearchItems', () => {
	it('treats unset form values as an empty search', () => {
		const wrapper = mockAppRoot().withSubscriptions([]).build();

		const { result } = renderHook(() => useAISearchItems(undefined, undefined, true), { wrapper });

		expect(result.current.data).toEqual({
			intelligent: [],
			filterSuggestions: [],
			searchText: '',
		});
		expect(result.current.isFetching).toBe(false);
	});
});
