import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';
import React from 'react';

import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../tests/mocks/data';
import { VideoConfContext } from '../../contexts/VideoConfContext';
import { useRoomList } from './useRoomList';

const user = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
});

const unreadRooms = [
	{ ...createFakeSubscription({ t: 'c', unread: 1 }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', unread: 1 }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', unread: 1 }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', unread: 1 }), ...createFakeRoom({ t: 'c' }) },
];

const favoriteRooms = [
	{ ...createFakeSubscription({ t: 'c', f: true, unread: undefined }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', f: true, unread: undefined }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', f: true, unread: undefined }), ...createFakeRoom({ t: 'c' }) },
];

const teams = [
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ teamMain: true }) },
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ teamMain: true }) },
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ teamMain: true }) },
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ teamMain: true }) },
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ teamMain: true }) },
];

const discussionRooms = [
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ prid: '123' }) },
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ prid: '124' }) },
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ prid: '125' }) },
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ prid: '126' }) },
	{ ...createFakeSubscription({ unread: undefined }), ...createFakeRoom({ prid: '127' }) },
];

const directRooms = [
	{ ...createFakeSubscription({ t: 'd', unread: undefined }), ...createFakeRoom({ t: 'd' }) },
	{ ...createFakeSubscription({ t: 'd', unread: undefined }), ...createFakeRoom({ t: 'd' }) },
	{ ...createFakeSubscription({ t: 'd', unread: undefined }), ...createFakeRoom({ t: 'd' }) },
	{ ...createFakeSubscription({ t: 'd', unread: undefined }), ...createFakeRoom({ t: 'd' }) },
];

const fakeRooms = [...unreadRooms, ...favoriteRooms, ...teams, ...discussionRooms, ...directRooms];

const emptyArr: any[] = [];

const getWrapperSettings = ({
	sidebarGroupByType = false,
	sidebarShowFavorites = false,
	isDiscussionEnabled = false,
	sidebarShowUnread = false,
	fakeRoom = undefined,
}: {
	sidebarGroupByType?: boolean;
	sidebarShowFavorites?: boolean;
	isDiscussionEnabled?: boolean;
	sidebarShowUnread?: boolean;
	fakeRoom?: SubscriptionWithRoom;
}) =>
	mockAppRoot()
		.wrap((children) => (
			<VideoConfContext.Provider
				value={
					{
						queryIncomingCalls: {
							subscribe: () => () => undefined,
							getSnapshot: () => {
								return emptyArr;
							},
						},
					} as any
				}
				children={children}
			/>
		))
		.withUser(user)
		.withSubscriptions([...fakeRooms, fakeRoom && fakeRoom].filter(Boolean) as unknown as SubscriptionWithRoom[])
		.withUserPreference('sidebarGroupByType', sidebarGroupByType)
		.withUserPreference('sidebarShowFavorites', sidebarShowFavorites)
		.withUserPreference('sidebarShowUnread', sidebarShowUnread)
		.withSetting('Discussion_enabled', isDiscussionEnabled);

it('should return roomList, groupsCount and groupsList', async () => {
	const {
		result: {
			current: { roomList, groupsList, groupsCount },
		},
	} = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({}).build(),
	});

	expect(roomList).toBeDefined();
	expect(groupsList).toBeDefined();
	expect(groupsCount).toBeDefined();
});

it('should return groupsCount with the correct count', async () => {
	const {
		result: {
			current: { groupsCount, roomList },
		},
	} = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({}).build(),
	});

	expect(groupsCount).toContain(fakeRooms.length);
	expect(groupsCount).not.toContain(fakeRooms.length + 5);
	expect(groupsCount.reduce((a, b) => a + b, 0)).toBe(fakeRooms.length);
	expect(groupsCount.reduce((a, b) => a + b, 0)).toEqual(roomList.length);
});

it('should return roomList with the subscribed rooms and the correct length', async () => {
	const {
		result: {
			current: { roomList },
		},
	} = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({}).build(),
	});
	expect(roomList).toContain(fakeRooms[0]);
	expect(roomList).toHaveLength(fakeRooms.length);
});

it('should return groupsList with "Conversations" if preference sidebarGroupByType is not enabled', async () => {
	const {
		result: {
			current: { groupsList },
		},
	} = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({}).build(),
	});
	expect(groupsList).toContain('Conversations');
	expect(groupsList).toHaveLength(1);
});

it('should return groupsList with "Teams" if sidebarGroupByType is enabled and roomList has teams', async () => {
	const {
		result: {
			current: { groupsList, groupsCount },
		},
	} = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});

	const teamsIndex = groupsList.indexOf('Teams');
	expect(groupsList).toContain('Teams');
	expect(groupsCount[teamsIndex]).toEqual(teams.length);
});

it('should return groupsList with "Favorites" if sidebarShowFavorites is enabled', async () => {
	const {
		result: {
			current: { groupsList, groupsCount },
		},
	} = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({ sidebarShowFavorites: true, sidebarGroupByType: true }).build(),
	});

	const favoritesIndex = groupsList.indexOf('Favorites');
	expect(groupsList).toContain('Favorites');
	expect(groupsCount[favoritesIndex]).toEqual(favoriteRooms.length);
});

it('should return groupsList with "Discussions" if isDiscussionEnabled is enabled', async () => {
	const {
		result: {
			current: { groupsList, groupsCount },
		},
	} = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({ isDiscussionEnabled: true, sidebarGroupByType: true }).build(),
	});

	const discussionIndex = groupsList.indexOf('Discussions');
	expect(groupsList).toContain('Discussions');
	expect(groupsCount[discussionIndex]).toEqual(discussionRooms.length);
});

it('should return groupsList without "Discussions" if isDiscussionEnabled is disabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({ isDiscussionEnabled: false, sidebarGroupByType: true }).build(),
	});
	expect(result.current.groupsList).not.toContain('Discussions');
});

it('should remove corresponding items from roomList and return groupCount 0 when group is collapsed', async () => {
	const {
		result: {
			current: { roomList, groupsCount, groupsList },
		},
	} = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	const channelsIndex = groupsList.indexOf('Channels');
	expect(groupsCount[channelsIndex]).toEqual(0);
	expect(roomList.length).toEqual(groupsCount.reduce((a, b) => a + b, 0));
});

it('should always return groupsCount and groupsList with the same length', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	expect(result.current.groupsCount.length).toEqual(result.current.groupsList.length);
});

it('should return "Unread" group with the correct items if sidebarShowUnread is enabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({ sidebarShowUnread: true, sidebarGroupByType: true }).build(),
	});
	const unreadIndex = result.current.groupsList.indexOf('Unread');
	expect(result.current.groupsList).toContain('Unread');
	expect(result.current.groupsCount[unreadIndex]).toEqual(unreadRooms.length);
});

it('should not include unread room in unread group if hideUnreadStatus is enabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		legacyRoot: true,
		wrapper: getWrapperSettings({
			sidebarShowUnread: true,
			sidebarGroupByType: true,
			fakeRoom: {
				...createFakeSubscription({ t: 'c', unread: 1, hideUnreadStatus: true }),
				...createFakeRoom({ t: 'c' }),
			} as unknown as SubscriptionWithRoom,
		}).build(),
	});
	const unreadIndex = result.current.groupsList.indexOf('Unread');
	const roomListUnread = result.current.roomList.filter((room) => room.unread);

	expect(result.current.groupsCount[unreadIndex]).toEqual(unreadRooms.length);
	expect(roomListUnread.length).not.toEqual(unreadRooms.length);
});
