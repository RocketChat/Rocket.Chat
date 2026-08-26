import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import { renderHook, waitFor } from '@testing-library/react';

import { useRoomList } from './useRoomList';
import type { SidebarRoomListGroup } from './useRoomList';
import { createFakeLicenseInfo, createFakeRoom, createFakeSubscription, createFakeUser } from '../../../tests/mocks/data';

jest.mock('../../lib/RoomManager', () => ({
	useOpenedRoom: () => undefined,
}));

// The hook returns a rich `groups` array; these helpers reproduce the legacy flat views used by the assertions.
const groupsListOf = (groups: SidebarRoomListGroup[]) => groups.map((group) => group.key);
const roomListOf = (groups: SidebarRoomListGroup[]) => groups.flatMap((group) => group.rooms);

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
	sidebarShowFavorites = true,
	sidebarShowUnread = false,
	isDiscussionEnabled = false,
	isEnterprise = false,
	fakeRoom = undefined,
	rooms = fakeRooms as unknown as SubscriptionWithRoom[],
	sidebarCategories = [],
}: {
	sidebarGroupByType?: boolean;
	sidebarShowFavorites?: boolean;
	sidebarShowUnread?: boolean;
	isDiscussionEnabled?: boolean;
	isEnterprise?: boolean;
	fakeRoom?: SubscriptionWithRoom;
	rooms?: SubscriptionWithRoom[];
	sidebarCategories?: { _id: string; name?: string; default?: boolean; showUnreads?: boolean; keepUnreadsOnTop?: boolean }[];
}) => {
	const root = mockAppRoot()
		.wrap((children) => (
			<VideoConfContext.Provider
				value={
					{
						queryIncomingCalls: () => [() => () => undefined, () => emptyArr],
					} as any
				}
			>
				{children}
			</VideoConfContext.Provider>
		))
		.withUser(user)
		.withSubscriptions([...rooms, fakeRoom && fakeRoom].filter(Boolean) as unknown as SubscriptionWithRoom[])
		.withUserPreference('sidebarGroupByType', sidebarGroupByType)
		.withUserPreference('sidebarShowFavorites', sidebarShowFavorites)
		.withUserPreference('sidebarShowUnread', sidebarShowUnread)
		.withUserPreference('sidebarCategories', sidebarCategories)
		.withSetting('Discussion_enabled', isDiscussionEnabled);

	if (isEnterprise) {
		root.withEndpoint('GET', '/v1/licenses.info', () => ({
			license: createFakeLicenseInfo({ hasValidLicense: true, activeModules: ['experimental-enterprise-features'] }),
		}));
	}

	return root;
};

it('should return roomList, groupsCount and groupsList', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({}).build(),
	});

	expect(roomListOf(result.current.groups)).toBeDefined();
	expect(groupsListOf(result.current.groups)).toBeDefined();
	expect(result.current.groupsCount).toBeDefined();
});

it('should return groupsCount with the correct count', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		// Hide custom categories and Favorites so every room folds into a single "Conversations" group.
		wrapper: getWrapperSettings({ sidebarShowFavorites: false }).build(),
	});

	const { groupsCount } = result.current;
	const roomList = roomListOf(result.current.groups);

	expect(groupsCount).toContain(fakeRooms.length);
	expect(groupsCount).not.toContain(fakeRooms.length + 5);
	expect(groupsCount.reduce((a, b) => a + b, 0)).toBe(fakeRooms.length);
	expect(groupsCount.reduce((a, b) => a + b, 0)).toEqual(roomList.length);
});

it('should return roomList with the subscribed rooms and the correct length', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({}).build(),
	});

	const roomList = roomListOf(result.current.groups);
	expect(roomList).toContain(fakeRooms[0]);
	expect(roomList).toHaveLength(fakeRooms.length);
});

it('should return groupsList with "Conversations" if preference sidebarGroupByType is not enabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		// Hide custom categories and Favorites so the only group is "Conversations".
		wrapper: getWrapperSettings({ sidebarShowFavorites: false }).build(),
	});

	const groupsList = groupsListOf(result.current.groups);
	expect(groupsList).toContain('Conversations');
	expect(groupsList).toHaveLength(1);
});

it('should return groupsList with "Teams" if sidebarGroupByType is enabled and roomList has teams', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});

	const groupsList = groupsListOf(result.current.groups);
	const teamsIndex = groupsList.indexOf('Teams');
	expect(groupsList).toContain('Teams');
	expect(result.current.groupsCount[teamsIndex]).toEqual(teams.length);
});

it('should group favorites into a "Favorites" group when sidebarShowFavorites is on', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarShowFavorites: true, sidebarGroupByType: true }).build(),
	});

	const groupsList = groupsListOf(result.current.groups);
	const favoritesIndex = groupsList.indexOf('Favorites');
	expect(groupsList).toContain('Favorites');
	expect(result.current.groupsCount[favoritesIndex]).toEqual(favoriteRooms.length);
});

it('should not group favorites when sidebarShowFavorites is off', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarShowFavorites: false, sidebarGroupByType: true }).build(),
	});
	expect(groupsListOf(result.current.groups)).not.toContain('Favorites');
});

it('should group unread rooms into an "Unread" group when sidebarShowUnread is on', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarShowUnread: true, sidebarGroupByType: true }).build(),
	});

	const groupsList = groupsListOf(result.current.groups);
	const unreadIndex = groupsList.indexOf('Unread');
	expect(groupsList).toContain('Unread');
	// The four seeded unread channels are pulled into the Unread group.
	expect(result.current.groupsCount[unreadIndex]).toEqual(unreadChannels.length);
});

it('should not group unread rooms when sidebarShowUnread is off', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarShowUnread: false, sidebarGroupByType: true }).build(),
	});
	expect(groupsListOf(result.current.groups)).not.toContain('Unread');
});

it('should return groupsList with "Discussions" if isDiscussionEnabled is enabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ isDiscussionEnabled: true, sidebarGroupByType: true }).build(),
	});

	const groupsList = groupsListOf(result.current.groups);
	const discussionIndex = groupsList.indexOf('Discussions');
	expect(groupsList).toContain('Discussions');
	expect(result.current.groupsCount[discussionIndex]).toEqual(discussionRooms.length);
});

it('should return groupsList without "Discussions" if isDiscussionEnabled is disabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ isDiscussionEnabled: false, sidebarGroupByType: true }).build(),
	});
	expect(groupsListOf(result.current.groups)).not.toContain('Discussions');
});

it('should remove corresponding items from roomList and return groupCount 0 when group is collapsed and "Show unreads" is off', async () => {
	// "Show unreads" for Channels defaults to false — no preference entry needed.
	const { result } = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true, isEnterprise: true }).build(),
	});
	// hasLicenseModule resolves asynchronously from the mock endpoint.
	await waitFor(() => {
		const groupsList = groupsListOf(result.current.groups);
		const roomList = roomListOf(result.current.groups);
		const channelsIndex = groupsList.indexOf('Channels');
		expect(result.current.groupsCount[channelsIndex]).toEqual(0);
		expect(roomList.length).toEqual(result.current.groupsCount.reduce((a, b) => a + b, 0));
	});
});

it('should hide all rooms and show a badge when a group is collapsed in CE ("Show unreads" is always off)', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	const groupsList = groupsListOf(result.current.groups);
	const channelsIndex = groupsList.indexOf('Channels');
	// In CE showUnreads is always off — collapsing hides everything.
	expect(result.current.groupsCount[channelsIndex]).toEqual(0);
	// The header badge accumulates unread data from the hidden rooms.
	expect(result.current.groups[channelsIndex].unreadInfo.tunread.length).toBeGreaterThan(0);
});

it('should keep unread rooms visible (and show no header badge) when a group is collapsed and "Show unreads" is on in EE', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		wrapper: getWrapperSettings({
			sidebarGroupByType: true,
			isEnterprise: true,
			sidebarCategories: [{ _id: 'Channels', name: 'Channels', default: true, showUnreads: true }],
		}).build(),
	});
	// hasLicenseModule resolves asynchronously from the mock endpoint.
	await waitFor(() => {
		const groupsList = groupsListOf(result.current.groups);
		const channelsIndex = groupsList.indexOf('Channels');
		// All 4 seeded channels are unread, so they stay visible despite the group being collapsed.
		expect(result.current.groupsCount[channelsIndex]).toEqual(unreadChannels.length);
		// With unreads visible, the header total badge is suppressed.
		expect(result.current.groups[channelsIndex].unreadInfo.unread).toEqual(0);
		expect(result.current.groups[channelsIndex].unreadInfo.tunread).toEqual([]);
	});
});

it('should always return groupsCount and groupsList with the same length', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	expect(result.current.groupsCount.length).toEqual(groupsListOf(result.current.groups).length);
});

it('should keep empty system categories visible (dimmed)', async () => {
	// Only a single DM exists, so with group-by-type on "Channels"/"Teams" have no rooms — but must still render.
	// Empty system groups are an EE-only feature.
	const onlyDirect = [
		{ ...createFakeSubscription({ t: 'd', ...emptyUnread }), ...createFakeRoom({ t: 'd' }) },
	] as unknown as SubscriptionWithRoom[];
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ rooms: onlyDirect, sidebarGroupByType: true, isEnterprise: true }).build(),
	});
	await waitFor(() => expect(groupsListOf(result.current.groups)).toContain('Channels'));
	const groupsList = groupsListOf(result.current.groups);
	expect(groupsList).toContain('Direct_Messages');
	expect(result.current.groups[groupsList.indexOf('Channels')].empty).toBe(true);
	expect(result.current.groups[groupsList.indexOf('Direct_Messages')].empty).toBe(false);
});

it('should keep the Favorites category visible when it is empty', async () => {
	// Empty Favorites group is an EE-only feature.
	const onlyDirect = [
		{ ...createFakeSubscription({ t: 'd', ...emptyUnread }), ...createFakeRoom({ t: 'd' }) },
	] as unknown as SubscriptionWithRoom[];
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ rooms: onlyDirect, sidebarGroupByType: true, sidebarShowFavorites: true, isEnterprise: true }).build(),
	});
	const unreadIndex = result.current.groupsList.indexOf('Unread');
	const roomListUnread = result.current.roomList.filter((item) => item.unread);

	expect(result.current.groupsCount[unreadIndex]).toEqual(unreadChannels.length);
	expect(roomListUnread.length).not.toEqual(unreadChannels.length);
});

it('should accumulate unread data into `groupedUnreadInfo` when group is collapsed and "Show unreads" is off', async () => {
	// The header total badge only accumulates when unreads are hidden, i.e. "Show unreads" off for the group.
	// Channels defaults to showUnreads=false — no preference entry needed.
	const { result } = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true, isEnterprise: true }).build(),
	});

	// hasLicenseModule resolves asynchronously from the mock endpoint.
	await waitFor(() => {
		const groupsList = groupsListOf(result.current.groups);
		const channelsIndex = groupsList.indexOf('Channels');
		const { groupMentions, unread, userMentions, tunread, tunreadUser } = result.current.groups[channelsIndex].unreadInfo;

		expect(groupMentions).toEqual(unreadChannels.reduce((acc, cv) => acc + cv.groupMentions, 0));
		expect(unread).toEqual(unreadChannels.reduce((acc, cv) => acc + cv.unread, 0));
		expect(userMentions).toEqual(unreadChannels.reduce((acc, cv) => acc + cv.userMentions, 0));
		expect(tunread).toEqual(unreadChannels.reduce((acc, cv) => [...acc, ...(cv.tunread || [])], [] as string[]));
		expect(tunreadUser).toEqual(unreadChannels.reduce((acc, cv) => [...acc, ...(cv.tunreadUser || [])], [] as string[]));
	});
});
