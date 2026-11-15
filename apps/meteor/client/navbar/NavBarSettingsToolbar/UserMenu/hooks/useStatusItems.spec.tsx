import type { IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useStatusItems } from './useStatusItems';

const user = { _id: 'john.doe', username: 'john.doe', status: 'online' } as IUser;

describe('useStatusItems', () => {
	it('offers the offline status as soon as the setting allows it, without reloading the statuses', async () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const renderStatusItems = (invisibleAllowed: boolean) =>
			renderHook(() => useStatusItems(user).map((item) => item.id), {
				wrapper: mockAppRoot()
					.withQueryClient(queryClient)
					.withEndpoint('GET', '/v1/custom-user-status.list', () => ({ statuses: [], count: 0, offset: 0, total: 0 }))
					.withSetting('Accounts_AllowInvisibleStatusOption', invisibleAllowed)
					.build(),
			});

		const withoutOffline = renderStatusItems(false);
		await waitFor(() => expect(withoutOffline.result.current).toContain('online'));
		expect(withoutOffline.result.current).not.toContain('offline');

		const withOffline = renderStatusItems(true);
		expect(withOffline.result.current).toContain('offline');
	});
});
