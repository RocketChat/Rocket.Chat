import { useUserSubscriptions, useEndpoint } from '@rocket.chat/ui-contexts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useSearchItems } from './useSearchItems';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserSubscriptions: jest.fn(),
	useEndpoint: jest.fn(),
}));

describe('useSearchItems', () => {
	let queryClient: QueryClient;
	let getSpotlightMock: jest.Mock;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		getSpotlightMock = jest.fn();
		(useEndpoint as jest.Mock).mockReturnValue(getSpotlightMock);
		jest.clearAllMocks();
	});

	const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

	it('should deduplicate a user if they already exist in local subscriptions as a self-DM', async () => {
		const myUserName = 'rocketchat.internal.admin.test';
		const myUserId = 'user_id_456';

		(useUserSubscriptions as jest.Mock).mockReturnValue([
			{
				_id: 'local_room_123',
				t: 'd',
				name: myUserName,
				uids: [myUserId],
			},
		]);

		getSpotlightMock.mockResolvedValueOnce({
			users: [{ _id: myUserId, username: myUserName, name: 'Rocket Chat Test' }],
			rooms: [],
		});

		const { result } = renderHook(() => useSearchItems(myUserName), { wrapper });

		expect(result.current.items).toHaveLength(1);
		expect(result.current.items[0]._id).toBe('local_room_123');

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.items).toHaveLength(1);
		expect(result.current.items[0]._id).toBe('local_room_123');
		expect(result.current.items[0].name).toBe(myUserName);
	});

	it('should append users from the server if they are NOT duplicates', async () => {
		(useUserSubscriptions as jest.Mock).mockReturnValue([{ _id: 'local_room_123', t: 'd', name: 'general' }]);

		getSpotlightMock.mockResolvedValueOnce({
			users: [{ _id: 'user_id_456', username: 'john.doe', name: 'John Doe' }],
			rooms: [],
		});

		const { result } = renderHook(() => useSearchItems('jo'), { wrapper });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.items).toHaveLength(2);
		});
	});
});
