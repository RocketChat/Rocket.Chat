import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useCannedResponseFilterOptions } from './useCannedResponseFilterOptions';
import { createFakeDepartment } from '../../../../tests/mocks/data';

it('should append the departments to the default options', async () => {
	const { result } = renderHook(() => useCannedResponseFilterOptions(), {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', { All: 'All', Public: 'Public', Private: 'Private' })
			.withEndpoint('GET', '/v1/livechat/department', () => ({
				departments: [createFakeDepartment({ _id: 'dep1', name: 'Sales' })],
				count: 1,
				offset: 0,
				total: 1,
			}))
			.build(),
	});

	expect(result.current).toEqual([
		['all', 'All'],
		['global', 'Public'],
		['user', 'Private'],
	]);

	await waitFor(() => expect(result.current).toHaveLength(4));
	expect(result.current[3]).toEqual(['dep1', 'Sales']);
});
