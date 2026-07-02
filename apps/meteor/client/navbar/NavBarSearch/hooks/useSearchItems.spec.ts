import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useUserSubscriptions, useEndpoint } from '@rocket.chat/ui-contexts';
import { renderHook, waitFor } from '@testing-library/react';

import { useSearchItems } from './useSearchItems';

jest.mock('@rocket.chat/ui-contexts', () => {
	const original = jest.requireActual('@rocket.chat/ui-contexts');
	return {
		...original,
		useUserSubscriptions: jest.fn(),
		useEndpoint: jest.fn(),
	};
});

describe('useSearchItems', () => {
	let getSpotlightMock: jest.Mock;

	beforeEach(() => {
		getSpotlightMock = jest.fn();
		jest.mocked(useEndpoint).mockReturnValue(getSpotlightMock);
		jest.clearAllMocks();
	});

	it('should deduplicate a user if they already exist in local subscriptions as a self-DM', async () => {
		const myUserName = 'rocketchat.internal.admin.test';
		const myUserId = 'user_id_456';

		jest.mocked(useUserSubscriptions).mockReturnValue([
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

		const { result } = renderHook(() => useSearchItems(myUserName), { wrapper: mockAppRoot().build() });

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
		jest.mocked(useUserSubscriptions).mockReturnValue([{ _id: 'local_room_123', t: 'd', name: 'general' }]);

		getSpotlightMock.mockResolvedValueOnce({
			users: [{ _id: 'user_id_456', username: 'john.doe', name: 'John Doe' }],
			rooms: [],
		});

		const { result } = renderHook(() => useSearchItems('jo'), { wrapper: mockAppRoot().build() });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.items).toHaveLength(2);
		});
	});
});
