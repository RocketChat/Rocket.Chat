import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import { renderHook } from '@testing-library/react';

import { useRoomList } from './useRoomList';
import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../tests/mocks/data';

const user = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
});

const emptyUnread = {
	userMentions: 0,
	groupMentions: 0,
	unread: 0,
	tunread: undefined,
	tunreadUser: undefined,
	tunreadGroup: undefined,
	alert: false,
};

const unreadChannels = [
	{ ...createFakeSubscription({ t: 'c', tunread: ['1'] }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', tunread: ['1'] }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', tunreadUser: ['1'] }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', tunreadUser: ['1'] }), ...createFakeRoom({ t: 'c' }) },
];

const favoriteRooms = [
	{ ...createFakeSubscription({ t: 'c', f: true, ...emptyUnread }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', f: true, ...emptyUnread }), ...createFakeRoom({ t: 'c' }) },
	{ ...createFakeSubscription({ t: 'c', f: true, ...emptyUnread }), ...createFakeRoom({ t: 'c' }) },
];

const teams = [
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ teamMain: true }) },
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ teamMain: true }) },
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ teamMain: true }) },
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ teamMain: true }) },
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ teamMain: true }) },
];

const discussionRooms = [
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ prid: '123' }) },
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ prid: '124' }) },
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ prid: '125' }) },
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ prid: '126' }) },
	{ ...createFakeSubscription({ ...emptyUnread }), ...createFakeRoom({ prid: '127' }) },
];

const directRooms = [
	{ ...createFakeSubscription({ t: 'd', ...emptyUnread }), ...createFakeRoom({ t: 'd' }) },
	{ ...createFakeSubscription({ t: 'd', ...emptyUnread }), ...createFakeRoom({ t: 'd' }) },
	{ ...createFakeSubscription({ t: 'd', ...emptyUnread }), ...createFakeRoom({ t: 'd' }) },
	{ ...createFakeSubscription({ t: 'd', ...emptyUnread }), ...createFakeRoom({ t: 'd' }) },
];

const fakeRooms = [...unreadChannels, ...favoriteRooms, ...teams, ...discussionRooms, ...directRooms];

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
						queryIncomingCalls: () => [() => () => undefined, () => emptyArr],
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
		wrapper: getWrapperSettings({ isDiscussionEnabled: true, sidebarGroupByType: true }).build(),
	});

	const discussionIndex = groupsList.indexOf('Discussions');
	expect(groupsList).toContain('Discussions');
	expect(groupsCount[discussionIndex]).toEqual(discussionRooms.length);
});

it('should return groupsList without "Discussions" if isDiscussionEnabled is disabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
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
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	const channelsIndex = groupsList.indexOf('Channels');
	expect(groupsCount[channelsIndex]).toEqual(0);
	expect(roomList.length).toEqual(groupsCount.reduce((a, b) => a + b, 0));
});

it('should always return groupsCount and groupsList with the same length', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	expect(result.current.groupsCount.length).toEqual(result.current.groupsList.length);
});

it('should return "Unread" group with the correct items if sidebarShowUnread is enabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarShowUnread: true, sidebarGroupByType: true }).build(),
	});
	const unreadIndex = result.current.groupsList.indexOf('Unread');
	expect(result.current.groupsList).toContain('Unread');
	expect(result.current.groupsCount[unreadIndex]).toEqual(unreadChannels.length);
});

it('should not include unread room in unread group if hideUnreadStatus is enabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
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

	expect(result.current.groupsCount[unreadIndex]).toEqual(unreadChannels.length);
	expect(roomListUnread.length).not.toEqual(unreadChannels.length);
});

it('should accumulate unread data into `groupedUnreadInfo` when group is collapsed', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});

	const channelsIndex = result.current.groupsList.indexOf('Channels');
	const { groupMentions, unread, userMentions, tunread, tunreadUser } = result.current.groupedUnreadInfo[channelsIndex];

	expect(groupMentions).toEqual(fakeRooms.reduce((acc, cv) => acc + cv.groupMentions, 0));
	expect(unread).toEqual(fakeRooms.reduce((acc, cv) => acc + cv.unread, 0));
	expect(userMentions).toEqual(fakeRooms.reduce((acc, cv) => acc + cv.userMentions, 0));
	expect(tunread).toEqual(fakeRooms.reduce((acc, cv) => [...acc, ...(cv.tunread || [])], [] as string[]));
	expect(tunreadUser).toEqual(fakeRooms.reduce((acc, cv) => [...acc, ...(cv.tunreadUser || [])], [] as string[]));
});

it('should add to unread group when has thread unread, even if alert is false', async () => {
	const fakeRoom = {
		...createFakeSubscription({ ...emptyUnread, tunread: ['1'], alert: false }),
	} as unknown as SubscriptionWithRoom;

	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({
			sidebarGroupByType: true,
			sidebarShowUnread: true,
			fakeRoom,
		}).build(),
	});

	const unreadGroup = result.current.roomList.splice(0, result.current.groupsCount[0]);
	expect(unreadGroup.find((room) => room.name === fakeRoom.name)).toBeDefined();
});

it('should not add room to unread group if thread unread is an empty array', async () => {
	const fakeRoom = {
		...createFakeSubscription({ ...emptyUnread, tunread: [] }),
	} as unknown as SubscriptionWithRoom;

	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({
			sidebarGroupByType: true,
			sidebarShowUnread: true,
			fakeRoom,
		}).build(),
	});

	const unreadGroup = result.current.roomList.splice(0, result.current.groupsCount[0]);
	expect(unreadGroup.find((room) => room.name === fakeRoom.name)).toBeUndefined();
});
