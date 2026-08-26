import type { ILivechatInquiryRecord, ISidebarCategory } from '@rocket.chat/core-typings';
import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserSubscriptions, useSetting } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { filterGroupVisibility, getRoomCategory, useCategoryList } from './useCategoryList';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { useSortQueryOptions } from '../../hooks/useSortQueryOptions';
import { useConferenceWindowEnabled } from '../../views/conference/hooks/useConferenceWindowEnabled';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../views/omnichannel/hooks/useQueuedInquiries';
import { useToggleUnreads } from '../categories/hooks/useToggleUnreads';
import { useUserSidebarCategories } from '../categories/hooks/useUserSidebarCategories';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

/** Stable, so the memo below doesn't recompute on every render once the sidebar stops listing incoming calls. */
const emptyIncomingCalls: ReturnType<typeof useVideoConfIncomingCalls> = [];

const order = [
	'Incoming_Calls',
	'Incoming_Livechats',
	'Open_Livechats',
	'On_Hold_Chats',
	'Unread',
	'Favorites',
	'Teams',
	'Discussions',
	'Channels',
	'Direct_Messages',
	'Conversations',
] as const;

type useRoomListReturnType = {
	roomList: Array<SubscriptionWithRoom>;
	groupsCount: number[];
	totalCount: number;
};

export const isUnreadRoom = (room: SubscriptionWithRoom): boolean =>
	!room.hideUnreadStatus && Boolean(room.alert || room.unread || room.tunread?.length);

export const useRoomList = ({ collapsedGroups }: { collapsedGroups?: string[] }): useRoomListReturnType => {
	const showOmnichannel = useOmnichannelEnabled();

	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');

	const { customCategories } = useUserSidebarCategories();
	const { isShowUnreads, isKeepUnreadsOnTop } = useToggleUnreads();

	const options = useSortQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	const incomingCalls = useVideoConfIncomingCalls();
	const conferenceWindowEnabled = useConferenceWindowEnabled();

	// With the call window, an incoming call is listed with the calls already running — behind the navbar button —
	// instead of becoming a group of its own at the top of the sidebar.
	const sidebarIncomingCalls = conferenceWindowEnabled ? emptyIncomingCalls : incomingCalls;

	const queue = inquiries.enabled ? inquiries.queue : emptyQueue;

	const groups = useDebouncedValue(
		useMemo(() => {
			const isCollapsed = (key: string) => collapsedGroups?.includes(key) ?? false;

			const incomingCall = new Set();
			const favorite = new Set();
			const team = new Set();
			const omnichannel = new Set();
			const unread = new Set();
			const channels = new Set();
			const direct = new Set();
			const discussion = new Set();
			const conversation = new Set();
			const onHold = new Set();

			rooms.forEach((room) => {
				const roomCategory = getRoomCategory(room, {
					groups: unfilteredGroups,
					hasIncomingCalls: (rid: SubscriptionWithRoom['rid']) => {
						return !!incomingCalls.find((call) => call.rid === rid);
					},
				});

				if (!roomCategory) {
					return;
				}

				if (sidebarIncomingCalls.find((call) => call.rid === room.rid)) {
					return incomingCall.add(room);
				}

				if (sidebarShowUnread && (room.alert || room.unread || room.tunread?.length) && !room.hideUnreadStatus) {
					return unread.add(room);
				}

				if (favoritesEnabled && room.f) {
					return favorite.add(room);
				}

				if (sidebarGroupByType && room.teamMain) {
					return team.add(room);
				}

				if (sidebarGroupByType && isDiscussionEnabled && room.prid) {
					return discussion.add(room);
				}

				if (room.t === 'c' || room.t === 'p') {
					channels.add(room);
				}

				if (room.t === 'l' && room.onHold) {
					return showOmnichannel && onHold.add(room);
				}

				if (room.t === 'l') {
					return showOmnichannel && omnichannel.add(room);
				}

				if (room.t === 'd') {
					direct.add(room);
				}

				conversation.add(room);
			});

			const groups = new Map<string, Set<any>>();
			incomingCall.size && groups.set('Incoming_Calls', incomingCall);

			const emptyUnreadInfo = (): GroupUnreadInfo => ({ userMentions: 0, groupMentions: 0, tunread: [], tunreadUser: [], unread: 0 });

			const buildUnreadInfo = (set: Set<SubscriptionWithRoom>): GroupUnreadInfo =>
				[...set].reduce<GroupUnreadInfo>((counter, room) => {
					if (room.hideUnreadStatus) {
						return counter;
					}

					acc.groupsList.push(key as TranslationKey);

					if (!room.unread && !room.tunread?.length && room.alert) {
						counter.unread += 1;
					}

					return counter;
				}, emptyUnreadInfo());

			return { groupsCount, groupsList, roomList, groupedUnreadInfo };
		}, [
			rooms,
			showOmnichannel,
			inquiries.enabled,
			queue,
			sidebarShowUnread,
			favoritesEnabled,
			sidebarGroupByType,
			isDiscussionEnabled,
			sidebarOrder,
			collapsedGroups,
			sidebarIncomingCalls,
		]),
		50,
	);

	// Group ordering is applied AFTER the debounce so that "Move up / Move down"
	// takes effect immediately rather than waiting for the 50 ms settling period.
	const groupsCount = useMemo(() => groups.map((group) => (group.empty ? 0 : group.rooms.length)), [groups]);

	return {
		groups,
		groupsCount,
		totalCount: useMemo(() => groupsCount.reduce((acc, count) => acc + count, 0), [groupsCount]),
	};
};
