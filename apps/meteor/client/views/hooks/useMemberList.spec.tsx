import { UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useStream } from '@rocket.chat/ui-contexts';
import { renderHook, act, waitFor } from '@testing-library/react';

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
		status?: UserStatus;
	}>;
};

jest.mock('@rocket.chat/ui-contexts', () => {
	const originalModule = jest.requireActual('@rocket.chat/ui-contexts');

	return {
		__esModule: true,
		...originalModule,
		useStream: jest.fn(),
	};
});

const mockUseStream = useStream as jest.MockedFunction<typeof useStream>;
const mockDMMembersEndpoint = jest.fn();
const mockRoomMembersEndpoint = jest.fn();

describe('useMembersList', () => {
	let fakeMembersPage1: MembersPage;
	let fakeMembersPage2: MembersPage;

	const wrapper = mockAppRoot()
		.withJohnDoe()
		.withSetting('UI_Use_Real_Name', false)
		.withEndpoint('GET', '/v1/im.members', (_params) => {
			mockDMMembersEndpoint();
			return fakeMembersPage1 as any;
		})
		.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', (_params) => {
			mockRoomMembersEndpoint();
			return fakeMembersPage1 as any;
		});

	beforeEach(() => {
		jest.clearAllMocks();

		fakeMembersPage1 = {
			offset: 0,
			count: 3,
			total: 5,
			members: [
				{ _id: 'user1', username: 'alex', roles: ['owner'], status: UserStatus.ONLINE },
				{ _id: 'user2', username: 'bob', roles: ['leader'], status: UserStatus.OFFLINE },
				{ _id: 'user3', username: 'john', roles: ['moderator'], status: UserStatus.OFFLINE },
			],
		};

		fakeMembersPage2 = {
			offset: 3,
			count: 2,
			total: 5,
			members: [
				{ _id: 'user4', username: 'chris', roles: [], status: UserStatus.ONLINE },
				{ _id: 'user5', username: 'zoe', roles: [], status: UserStatus.OFFLINE },
			],
		};

		mockUseStream.mockReturnValue(() => () => undefined);
	});

	it('fetches members using the correct endpoint for roomType c', async () => {
		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 3,
					debouncedText: '',
					roomType: 'c',
				}),
			{ legacyRoot: true, wrapper: wrapper.build() },
		);

		await expect(result.current.isLoading).toBe(true);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(mockDMMembersEndpoint).not.toHaveBeenCalled();
		expect(mockRoomMembersEndpoint).toHaveBeenCalled();

		expect(result.current.data?.pages[0].members).toHaveLength(fakeMembersPage1.members.length);
	});

	it('fetches members using the correct endpoint for roomType p', async () => {
		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 3,
					debouncedText: '',
					roomType: 'p',
				}),
			{ legacyRoot: true, wrapper: wrapper.build() },
		);

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		expect(mockRoomMembersEndpoint).toHaveBeenCalled();
		expect(mockDMMembersEndpoint).not.toHaveBeenCalled();

		expect(result.current.data?.pages[0].members).toHaveLength(fakeMembersPage1.members.length);
	});

	it('fetches from /v1/im.members if roomType is d', async () => {
		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'directRoomId',
					type: 'all',
					limit: 3,
					debouncedText: '',
					roomType: 'd',
				}),
			{ legacyRoot: true, wrapper: wrapper.build() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		expect(mockDMMembersEndpoint).toHaveBeenCalled();
		expect(mockRoomMembersEndpoint).not.toHaveBeenCalled();

		expect(result.current.data?.pages[0].members).toHaveLength(fakeMembersPage1.members.length);
	});

	it('applies pagination with fetchNextPage', async () => {
		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 3,
					debouncedText: '',
					roomType: 'c',
				}),
			{
				legacyRoot: true,
				wrapper: wrapper
					.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', ({ offset }) => {
						if (offset === 0) {
							return fakeMembersPage1 as any;
						}
						if (offset === 3) {
							return fakeMembersPage2 as any;
						}
						return {
							members: [],
							offset,
							count: 0,
							total: 5,
						};
					})
					.build(),
			},
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.data?.pages[0].members).toHaveLength(3);

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
					limit: 3,
					debouncedText: '',
					roomType: 'c',
				}),
			{ legacyRoot: true, wrapper: wrapper.build() },
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

		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 3,
					debouncedText: '',
					roomType: 'c',
				}),
			{ legacyRoot: true, wrapper: wrapper.build() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		let user2 = result.current.data?.pages[0].members.find((m) => m._id === 'user2') as RoomMember;
		expect(user2?.roles).toEqual(['leader']);

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
		await waitFor(() => expect(user2?.roles).toContain('leader'));
	});

	it('sorts members list cache by "roles > status > username/name" logic on roles-change', async () => {
		const customPage = {
			offset: 0,
			count: 6,
			total: 6,
			members: [
				{ _id: 'u1', username: 'mark', roles: ['owner'], status: UserStatus.OFFLINE },
				{ _id: 'u2', username: 'michael', roles: ['leader'], status: UserStatus.OFFLINE },
				{ _id: 'u3', username: 'karl', roles: ['moderator'], status: UserStatus.ONLINE },
				{ _id: 'u4', username: 'bob', roles: ['moderator'], status: UserStatus.OFFLINE },
				{ _id: 'u5', username: 'alex', roles: [], status: UserStatus.OFFLINE },
				{ _id: 'u6', username: 'john', roles: [], status: UserStatus.ONLINE },
			],
		};

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
					limit: 5,
					debouncedText: '',
					roomType: 'c',
				}),
			{
				legacyRoot: true,
				wrapper: wrapper.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', (_params) => customPage as any).build(),
			},
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		let memberIds = result.current.data?.pages[0].members.map((m) => m._id);
		expect(memberIds).toEqual(['u1', 'u2', 'u3', 'u4', 'u5', 'u6']);

		// Simulate giving user 'alex/u5' the "moderator" role.
		// That should push 'alex/u5' to the third of the sorted list -
		// after mark/u1 and michael/u2 (since owner), after karl/u3 (since online) and before bob/u4 (since sort by username).
		act(() => {
			rolesChangeCallback?.({
				type: 'added',
				scope: 'room123',
				u: { _id: 'u5' },
				_id: 'moderator',
			});
		});

		await waitFor(() => {
			memberIds = result.current.data?.pages[0].members.map((m) => m._id);
			expect(memberIds).toEqual(['u1', 'u2', 'u3', 'u5', 'u4', 'u6']);
		});
	});

	it('re-sorts members globally across multiple pages on roles-change and verifies exact array match', async () => {
		const firstPage = {
			offset: 0,
			count: 2,
			total: 4,
			members: [
				{ _id: 'userA', username: 'adam', roles: ['owner'], status: UserStatus.OFFLINE },
				{ _id: 'userB', username: 'bea', roles: ['moderator'], status: UserStatus.OFFLINE },
			],
		};

		const secondPage = {
			offset: 2,
			count: 2,
			total: 4,
			members: [
				{ _id: 'userC', username: 'charlie', roles: [], status: UserStatus.ONLINE },
				{ _id: 'userD', username: 'david', roles: [], status: UserStatus.OFFLINE },
			],
		};

		let rolesChangeCallback: ((payload: any) => void) | undefined;

		mockUseStream.mockReturnValue((eventName, cb) => {
			if (eventName === 'roles-change') {
				rolesChangeCallback = cb as any;
			}
			return () => undefined;
		});

		const testWrapper = wrapper.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', ({ offset }) => {
			if (offset === 0) {
				return firstPage as any;
			}
			if (offset === 2) {
				return secondPage as any;
			}
			return { offset, count: 2, total: 4, members: [] } as any;
		});

		const { result } = renderHook(
			() =>
				useMembersList({
					rid: 'room123',
					type: 'all',
					limit: 2,
					debouncedText: '',
					roomType: 'c',
				}),
			{ legacyRoot: true, wrapper: testWrapper.build() },
		);

		// Page 1
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.data?.pages).toHaveLength(1);
		expect(result.current.data?.pages[0].members.map((m) => m._id)).toStrictEqual(['userA', 'userB']);

		// Page 2
		await act(async () => {
			await result.current.fetchNextPage();
		});

		await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));
		await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
		expect(result.current.data?.pages[1].members.map((m) => m._id)).toStrictEqual(['userC', 'userD']);

		// Give userC the "owner" role
		await act(async () => {
			await rolesChangeCallback?.({
				type: 'added',
				scope: 'room123',
				u: { _id: 'userC' },
				_id: 'owner',
			});
		});

		expect(result.current.data?.pages).toHaveLength(2);

		const userC = result.current.data?.pages.flatMap((page) => page.members).find((m) => m._id === 'userC') as RoomMember | null;
		await waitFor(() => expect(userC?.roles).toContain('owner'));

		// userC now has 'owner' + ONLINE => sits at the top after sorting
		// then userA (owner), then userB (moderator), then userD (member)
		expect(result.current.data?.pages[0].members).toHaveLength(2);
		expect(result.current.data?.pages[1].members).toHaveLength(2);

		await waitFor(() => expect(result.current.data?.pages[0].members.map((m) => m._id)).toStrictEqual(['userC', 'userA']));
		await waitFor(() => expect(result.current.data?.pages[1].members.map((m) => m._id)).toStrictEqual(['userB', 'userD']));
	});
});
