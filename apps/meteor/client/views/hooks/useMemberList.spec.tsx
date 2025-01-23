import { useStream, useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

import type { RoomMember } from './useMembersList';
import { useMembersList } from './useMembersList';

type MembersPage = {
	offset: number;
	count: number;
	total: number;
	members: Array<{
		_id: string;
		username: string;
		roles: string[];
		status: string;
	}>;
};

jest.mock('@rocket.chat/ui-contexts', () => ({
	useStream: jest.fn(),
	useEndpoint: jest.fn(),
	useSetting: jest.fn(),
}));

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

const mockUseStream = useStream as jest.MockedFunction<typeof useStream>;
const mockUseEndpoint = useEndpoint as jest.MockedFunction<typeof useEndpoint>;
const mockUseSetting = useSetting as jest.MockedFunction<typeof useSetting>;

describe('useMembersList', () => {
	let queryClient: QueryClient;

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);

	let fakeMembersPage1: MembersPage;
	let fakeMembersPage2: MembersPage;

	beforeEach(() => {
		jest.clearAllMocks();

		fakeMembersPage1 = {
			offset: 0,
			count: 20,
			total: 40,
			members: [
				{ _id: 'user1', username: 'alex', roles: ['owner'], status: 'online' },
				{ _id: 'user2', username: 'john', roles: ['moderator'], status: 'offline' },
			],
		};

		fakeMembersPage2 = {
			offset: 20,
			count: 20,
			total: 40,
			members: [
				{ _id: 'user3', username: 'chris', roles: [], status: 'online' },
				{ _id: 'user4', username: 'zoe', roles: [], status: 'offline' },
			],
		};

		queryClient = createTestQueryClient();

		mockUseStream.mockReturnValue(() => () => undefined);

		mockUseSetting.mockImplementation((setting) => {
			if (setting === 'UI_Use_Real_Name') {
				return false;
			}
			return undefined;
		});

		mockUseEndpoint.mockImplementation(() => {
			return async () => fakeMembersPage1;
		});
	});

	it('fetches members using the correct endpoint for roomType c', async () => {
		mockUseEndpoint.mockImplementation(((_method: 'GET', path: string) => {
			if (path === '/v1/rooms.membersOrderedByRole') {
				return async () => fakeMembersPage1;
			}
			return async () => ({ members: [] });
		}) as unknown as typeof useEndpoint);

		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 20,
					debouncedText: '',
					roomType: 'c',
				}),
			{ legacyRoot: true, wrapper },
		);

		await expect(result.current.isLoading).toBe(true);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.data?.pages[0].members).toHaveLength(fakeMembersPage1.members.length);
	});

	it('fetches members using the correct endpoint for roomType p', async () => {
		mockUseEndpoint.mockImplementation(((_method: 'GET', path: string) => {
			if (path === '/v1/rooms.membersOrderedByRole') {
				return async () => fakeMembersPage1;
			}
			return async () => ({ members: [] });
		}) as unknown as typeof useEndpoint);

		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 20,
					debouncedText: '',
					roomType: 'p',
				}),
			{ legacyRoot: true, wrapper },
		);

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.data?.pages[0].members).toHaveLength(fakeMembersPage1.members.length);
	});

	it('fetches from /v1/im.members if roomType is d', async () => {
		mockUseEndpoint.mockImplementation(((_method: 'GET', path: string) => {
			if (path === '/v1/im.members') {
				return async () => fakeMembersPage1;
			}
			// fallback
			return async () => ({ members: [] });
		}) as unknown as typeof useEndpoint);

		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'directRoomId',
					type: 'all',
					limit: 20,
					debouncedText: '',
					roomType: 'd',
				}),
			{ legacyRoot: true, wrapper },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.data?.pages[0].members).toHaveLength(fakeMembersPage1.members.length);
	});

	it('applies pagination with fetchNextPage', async () => {
		mockUseEndpoint.mockImplementation(() => {
			return async ({ offset }: { offset: number }) => {
				if (offset === 0) {
					return fakeMembersPage1;
				}
				if (offset === 20) {
					return fakeMembersPage2;
				}
				return {
					members: [],
					offset,
					count: 20,
					total: 40,
				};
			};
		});

		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 20,
					debouncedText: '',
					roomType: 'c',
				}),
			{ legacyRoot: true, wrapper },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.data?.pages[0].members).toHaveLength(2);

		await act(async () => {
			await result.current.fetchNextPage();
		});

		await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));
		await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
		expect(result.current.data?.pages[1].members).toHaveLength(2);
	});

	it('subscribes to "roles-change" and unsubscribes on unmount', async () => {
		const unsubscribeMock = jest.fn();
		const subscribeMock = jest.fn().mockReturnValue(unsubscribeMock);

		mockUseStream.mockReturnValue(subscribeMock);

		const { unmount } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 20,
					debouncedText: '',
					roomType: 'c',
				}),
			{ legacyRoot: true, wrapper },
		);

		await waitFor(() => expect(subscribeMock).toHaveBeenCalledWith('roles-change', expect.any(Function)));

		unmount();
		expect(unsubscribeMock).toHaveBeenCalled();
	});

	it('updates member roles in the cache on roles-change', async () => {
		const subscribeMock = jest.fn();
		let rolesChangeCallback: ((payload: any) => void) | undefined = undefined;

		subscribeMock.mockImplementation((eventName, cb) => {
			if (eventName === 'roles-change') {
				rolesChangeCallback = cb;
			}
			return () => undefined; // unsubscribe mock
		});
		mockUseStream.mockReturnValue(subscribeMock);

		// user2 starts with roles ['moderator']
		mockUseEndpoint.mockReturnValueOnce(async () => fakeMembersPage1);

		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 20,
					debouncedText: '',
					roomType: 'c',
				}),
			{ legacyRoot: true, wrapper },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		let user2 = result.current.data?.pages[0].members.find((m) => m._id === 'user2') as RoomMember;
		expect(user2?.roles).toEqual(['moderator']);

		// Simulate a roles-change event "added" for user2 -> 'owner'
		await act(async () => {
			rolesChangeCallback?.({
				type: 'added',
				scope: 'room123',
				u: { _id: 'user2' },
				_id: 'owner',
			});
		});

		user2 = result.current.data?.pages[0].members.find((m) => m._id === 'user2') as RoomMember;

		await waitFor(() => expect(user2?.roles).toContain('owner'));
		await waitFor(() => expect(user2?.roles).toContain('moderator'));
	});

	it('sorts members list cache by "roles > status > username/name" logic on roles-change', async () => {
		const customPage = {
			offset: 0,
			count: 4,
			total: 4,
			members: [
				{ _id: 'u1', username: 'michael', roles: ['owner'], status: 'offline' },
				{ _id: 'u2', username: 'karl', roles: ['moderator'], status: 'online' },
				{ _id: 'u3', username: 'bob', roles: ['moderator'], status: 'offline' },
				{ _id: 'u4', username: 'alex', roles: [], status: 'offline' },
				{ _id: 'u5', username: 'john', roles: [], status: 'online' },
			],
		};

		mockUseEndpoint.mockReturnValueOnce(async () => customPage);

		let rolesChangeCallback: ((payload: any) => void) | undefined;
		mockUseStream.mockReturnValue((eventName, cb) => {
			if (eventName === 'roles-change') {
				rolesChangeCallback = cb as any;
			}
			return () => undefined;
		});

		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 20,
					debouncedText: '',
					roomType: 'c',
				}),
			{
				legacyRoot: true,
				wrapper,
			},
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		let memberIds = result.current.data?.pages[0].members.map((m) => m._id);
		expect(memberIds).toEqual(['u1', 'u2', 'u3', 'u4', 'u5']);

		// Simulate giving user 'alex/u4' the "moderator" role.
		// That should push 'alex/u4' to the third of the sorted list -
		// after michael/u1 (since owner), after karl/u2 (since online) and before bob/u3 (since sort by username).
		act(() => {
			rolesChangeCallback?.({
				type: 'added',
				scope: 'room123',
				u: { _id: 'u4' },
				_id: 'moderator',
			});
		});

		await waitFor(() => {
			memberIds = result.current.data?.pages[0].members.map((m) => m._id);
			expect(memberIds).toEqual(['u1', 'u2', 'u4', 'u3', 'u5']);
		});
	});
});
