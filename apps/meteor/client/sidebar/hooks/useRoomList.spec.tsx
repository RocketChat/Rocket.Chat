import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import { renderHook } from '@testing-library/react';

import { useRoomList } from './useRoomList';
import type { SidebarRoomListGroup } from './useRoomList';
import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../tests/mocks/data';
import { useShowUnreadsGroups } from '../../views/navigation/hooks/useShowUnreadsGroups';

const mockedUseShowUnreadsGroups = jest.mocked(useShowUnreadsGroups);

// `useRoomList` reads the open room to keep it visible while collapsed; mock it (no room open in these tests)
// to avoid loading the real RoomManager module graph (which imports non-JS assets jest can't transform).
jest.mock('../../lib/RoomManager', () => ({
	useOpenedRoom: () => undefined,
}));

// System groups read their "Show unreads" flag from this hook (localStorage-backed in the app). Mock it so
// tests control it deterministically; it defaults ON (matching the real default), and the off-path tests
// override it for a specific group.
jest.mock('../../views/navigation/hooks/useShowUnreadsGroups');

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
	sidebarShowCustomCategories = true,
	isDiscussionEnabled = false,
	sidebarDynamicCategory = 'none',
	fakeRoom = undefined,
	rooms = fakeRooms as unknown as SubscriptionWithRoom[],
}: {
	sidebarGroupByType?: boolean;
	sidebarShowCustomCategories?: boolean;
	isDiscussionEnabled?: boolean;
	sidebarDynamicCategory?: 'none' | 'mention' | 'unreads';
	fakeRoom?: SubscriptionWithRoom;
	rooms?: SubscriptionWithRoom[];
}) =>
	mockAppRoot()
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
		.withUserPreference('sidebarShowCustomCategories', sidebarShowCustomCategories)
		.withUserPreference('sidebarDynamicCategory', sidebarDynamicCategory)
		.withSetting('Discussion_enabled', isDiscussionEnabled);

// System groups default to "Show unreads" ON; off-path tests override this per test.
beforeEach(() => {
	mockedUseShowUnreadsGroups.mockReturnValue({ isShowUnreads: () => true, toggleShowUnreads: jest.fn() });
});

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
		// Hide custom categories (incl. Favorites) so every room folds into a single "Conversations" group.
		wrapper: getWrapperSettings({ sidebarShowCustomCategories: false }).build(),
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
		// Hide custom categories (incl. Favorites) so the only group is "Conversations".
		wrapper: getWrapperSettings({ sidebarShowCustomCategories: false }).build(),
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

it('should return groupsList with "Favorites" when custom categories are shown (favorites are part of Custom)', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarShowCustomCategories: true, sidebarGroupByType: true }).build(),
	});

	const groupsList = groupsListOf(result.current.groups);
	const favoritesIndex = groupsList.indexOf('Favorites');
	expect(groupsList).toContain('Favorites');
	expect(result.current.groupsCount[favoritesIndex]).toEqual(favoriteRooms.length);
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
	// "Show unreads" defaults ON, which keeps unread rooms visible while collapsed; turn it off for Channels.
	mockedUseShowUnreadsGroups.mockReturnValue({ isShowUnreads: (group) => group !== 'Channels', toggleShowUnreads: jest.fn() });
	const { result } = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	const groupsList = groupsListOf(result.current.groups);
	const roomList = roomListOf(result.current.groups);
	const channelsIndex = groupsList.indexOf('Channels');
	expect(result.current.groupsCount[channelsIndex]).toEqual(0);
	expect(roomList.length).toEqual(result.current.groupsCount.reduce((a, b) => a + b, 0));
});

it('should keep unread rooms visible (and show no header badge) when a group is collapsed and "Show unreads" is on by default', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	const groupsList = groupsListOf(result.current.groups);
	const channelsIndex = groupsList.indexOf('Channels');
	// All 4 seeded channels are unread, so they stay visible despite the group being collapsed.
	expect(result.current.groupsCount[channelsIndex]).toEqual(unreadChannels.length);
	// With unreads visible, the header total badge is suppressed.
	expect(result.current.groups[channelsIndex].unreadInfo.unread).toEqual(0);
	expect(result.current.groups[channelsIndex].unreadInfo.tunread).toEqual([]);
});

it('should always return groupsCount and groupsList with the same length', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});
	expect(result.current.groupsCount.length).toEqual(groupsListOf(result.current.groups).length);
});

it('should return "Unreads" group with the correct items when the dynamic category is "unreads"', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarDynamicCategory: 'unreads', sidebarGroupByType: true }).build(),
	});
	const groupsList = groupsListOf(result.current.groups);
	const unreadIndex = groupsList.indexOf('Unreads');
	expect(groupsList).toContain('Unreads');
	expect(result.current.groupsCount[unreadIndex]).toEqual(unreadChannels.length);
});

it('should render the dynamic category first (its default position)', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarDynamicCategory: 'unreads', sidebarGroupByType: true }).build(),
	});
	expect(groupsListOf(result.current.groups)[0]).toEqual('Unreads');
});

it('should return "Mentions" group with only user-mentioned rooms when the dynamic category is "mention"', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarDynamicCategory: 'mention', sidebarGroupByType: true }).build(),
	});
	const groupsList = groupsListOf(result.current.groups);
	const mentionsIndex = groupsList.indexOf('Mentions');
	// Only rooms with a direct/thread user mention move here — group mentions (@all/@here) do not count.
	const expected = fakeRooms.filter((room) => !room.hideUnreadStatus && Boolean(room.userMentions || room.tunreadUser?.length)).length;
	expect(expected).toBeGreaterThan(0);
	expect(groupsList).toContain('Mentions');
	expect(result.current.groupsCount[mentionsIndex]).toEqual(expected);
});

it('should not render a Favorites group when custom categories are hidden', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ sidebarShowCustomCategories: false, sidebarGroupByType: true }).build(),
	});
	expect(groupsListOf(result.current.groups)).not.toContain('Favorites');
});

it('should keep empty system categories visible so rooms can be dragged back', async () => {
	// Only a single DM exists, so with group-by-type on "Channels"/"Teams" have no rooms — but must still render.
	const onlyDirect = [
		{ ...createFakeSubscription({ t: 'd', ...emptyUnread }), ...createFakeRoom({ t: 'd' }) },
	] as unknown as SubscriptionWithRoom[];
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ rooms: onlyDirect, sidebarGroupByType: true }).build(),
	});
	const groupsList = groupsListOf(result.current.groups);
	expect(groupsList).toContain('Channels');
	expect(groupsList).toContain('Direct_Messages');
	expect(result.current.groups[groupsList.indexOf('Channels')].empty).toBe(true);
	expect(result.current.groups[groupsList.indexOf('Direct_Messages')].empty).toBe(false);
});

it('should keep the Favorites category visible when it is empty', async () => {
	const onlyDirect = [
		{ ...createFakeSubscription({ t: 'd', ...emptyUnread }), ...createFakeRoom({ t: 'd' }) },
	] as unknown as SubscriptionWithRoom[];
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({ rooms: onlyDirect, sidebarGroupByType: true, sidebarShowCustomCategories: true }).build(),
	});
	const groupsList = groupsListOf(result.current.groups);
	expect(groupsList).toContain('Favorites');
	expect(result.current.groups[groupsList.indexOf('Favorites')].empty).toBe(true);
});

it('should not include unread room in unread group if hideUnreadStatus is enabled', async () => {
	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({
			sidebarDynamicCategory: 'unreads',
			sidebarGroupByType: true,
			fakeRoom: {
				...createFakeSubscription({ t: 'c', unread: 1, hideUnreadStatus: true }),
				...createFakeRoom({ t: 'c' }),
			} as unknown as SubscriptionWithRoom,
		}).build(),
	});
	const groupsList = groupsListOf(result.current.groups);
	const unreadIndex = groupsList.indexOf('Unreads');
	const roomListUnread = roomListOf(result.current.groups).filter((room) => room.unread);

	expect(result.current.groupsCount[unreadIndex]).toEqual(unreadChannels.length);
	expect(roomListUnread.length).not.toEqual(unreadChannels.length);
});

it('should accumulate unread data into `groupedUnreadInfo` when group is collapsed and "Show unreads" is off', async () => {
	// The header total badge only accumulates when unreads are hidden, i.e. "Show unreads" off for the group.
	mockedUseShowUnreadsGroups.mockReturnValue({ isShowUnreads: (group) => group !== 'Channels', toggleShowUnreads: jest.fn() });
	const { result } = renderHook(() => useRoomList({ collapsedGroups: ['Channels'] }), {
		wrapper: getWrapperSettings({ sidebarGroupByType: true }).build(),
	});

	const groupsList = groupsListOf(result.current.groups);
	const channelsIndex = groupsList.indexOf('Channels');
	const { groupMentions, unread, userMentions, tunread, tunreadUser } = result.current.groups[channelsIndex].unreadInfo;

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
			sidebarDynamicCategory: 'unreads',
			fakeRoom,
		}).build(),
	});

	const roomList = roomListOf(result.current.groups);
	const unreadGroup = roomList.splice(0, result.current.groupsCount[0]);
	expect(unreadGroup.find((room) => room.name === fakeRoom.name)).toBeDefined();
});

it('should not add room to unread group if thread unread is an empty array', async () => {
	const fakeRoom = {
		...createFakeSubscription({ ...emptyUnread, tunread: [] }),
	} as unknown as SubscriptionWithRoom;

	const { result } = renderHook(() => useRoomList({ collapsedGroups: [] }), {
		wrapper: getWrapperSettings({
			sidebarGroupByType: true,
			sidebarDynamicCategory: 'unreads',
			fakeRoom,
		}).build(),
	});

	const roomList = roomListOf(result.current.groups);
	const unreadGroup = roomList.splice(0, result.current.groupsCount[0]);
	expect(unreadGroup.find((room) => room.name === fakeRoom.name)).toBeUndefined();
});
