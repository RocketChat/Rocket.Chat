import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

type FilterSystemCategoriesOptions = {
	showOmnichannel: boolean;
	inquiriesEnabled: boolean;
	sidebarGroupByType: boolean;
	favoritesEnabled: boolean;
	sidebarShowUnread: boolean;
	isDiscussionEnabled: boolean;
};

const filterSystemCategories = (categories: readonly string[], options: FilterSystemCategoriesOptions) => {
	const { showOmnichannel, inquiriesEnabled, sidebarGroupByType, favoritesEnabled, sidebarShowUnread, isDiscussionEnabled } = options;
	return categories.filter((key) => {
		switch (key) {
			case 'Incoming_Livechats':
				return showOmnichannel && inquiriesEnabled;
			case 'On_Hold_Chats':
			case 'Open_Livechats':
				return showOmnichannel;
			case 'Discussions':
				return sidebarGroupByType && isDiscussionEnabled;
			case 'Teams':
			case 'Channels':
			case 'Direct_Messages':
				return sidebarGroupByType;
			case 'Conversations':
				return !sidebarGroupByType;
			case 'Unread':
				return sidebarShowUnread;
			case 'Favorites':
				return favoritesEnabled;
			case 'Incoming_Calls':
			default:
				return true;
		}
	});
};

export const SIDEBAR_DYNAMIC_GROUP_KEYS: readonly string[] = [
	'Incoming_Calls',
	'Incoming_Livechats',
	'Open_Livechats',
	'On_Hold_Chats',
	'Unread',
];

export const mergeWithSectionsOrder = (explicitIds: string[], sectionsOrder: readonly string[]): string[] => {
	const merged = [...explicitIds];
	for (const key of sectionsOrder) {
		if (merged.includes(key)) continue;
		const successorIdx = sectionsOrder
			.slice(sectionsOrder.indexOf(key) + 1)
			.map((k) => merged.indexOf(k))
			.find((pos) => pos !== -1);
		merged.splice(successorIdx ?? merged.length, 0, key);
	}
	return merged;
};

export const withDynamicFirst = (ids: string[], sectionsOrder: readonly string[]): string[] => {
	const dynamicInOrder = sectionsOrder.filter((k) => SIDEBAR_DYNAMIC_GROUP_KEYS.includes(k));
	const staticIds = ids.filter((k) => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(k));
	const staticOrder = sectionsOrder.filter((k) => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(k));
	return [...dynamicInOrder, ...mergeWithSectionsOrder(staticIds, staticOrder)];
};

export const filterGroupVisibility = <T>(
	groups: Map<string, Set<SubscriptionWithRoom>>,
	hasLicenseModule: boolean,
	makeGroup: (key: string, set: Set<SubscriptionWithRoom>) => T,
): T[] => {
	const filteredGroups: T[] = [];
	groups.forEach((group, key) => {
		if (!group) {
			return;
		}

		if (key === 'Conversations') {
			filteredGroups.push(makeGroup(key, group));
			return;
		}

		if (!hasLicenseModule || SIDEBAR_DYNAMIC_GROUP_KEYS.includes(key)) {
			if (group.size > 0) {
				filteredGroups.push(makeGroup(key, group));
			}

			return;
		}

		return filteredGroups.push(makeGroup(key, group));
	});

	return filteredGroups;
};

const isUnreadRoom = (room: SubscriptionWithRoom): boolean =>
	!room.hideUnreadStatus && Boolean(room.alert || room.unread || room.tunread?.length);

export const getRoomCategory = (
	room: SubscriptionWithRoom,
	{
		groups,
		hasIncomingCalls,
	}: {
		groups: Map<string, Set<SubscriptionWithRoom>>;
		hasIncomingCalls: (room: SubscriptionWithRoom['rid']) => boolean;
	},
): string | false => {
	if (room.archived) {
		return false;
	}

	if (hasIncomingCalls(room.rid)) {
		return 'Incoming_Calls';
	}

	if (isUnreadRoom(room) && groups.has('Unread')) {
		return 'Unread';
	}

	if (room.category && groups.has(room.category)) {
		return room.category;
	}

	if (room.f && groups.has('Favorites')) {
		return 'Favorites';
	}

	if (room.teamMain && groups.has('Teams')) {
		return 'Teams';
	}

	if (room.prid && groups.has('Discussions')) {
		return 'Discussions';
	}

	if (room.t === 'l' && room.onHold) {
		if (!groups.has('On_Hold_Chats')) {
			return false;
		}
		return 'On_Hold_Chats';
	}

	if (room.t === 'l') {
		if (!groups.has('Open_Livechats')) {
			return false;
		}
		return 'Open_Livechats';
	}

	if ((room.t === 'c' || room.t === 'p') && groups.has('Channels')) {
		return 'Channels';
	}

	if (room.t === 'd' && groups.has('Direct_Messages')) {
		return 'Direct_Messages';
	}

	return 'Conversations';
};

export const useCategoryList = (showOmnichannel: boolean, inquiriesEnabled: boolean) => {
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');
	const sidebarCategories = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];
	const sidebarSectionsOrder: readonly string[] = useUserPreference<string[]>('sidebarSectionsOrder') ?? SIDEBAR_SYSTEM_GROUP_KEYS;
	const sidebarGroupByType = useUserPreference<boolean>('sidebarGroupByType') ?? false;
	const favoritesEnabled = useUserPreference<boolean>('sidebarShowFavorites', true) ?? true;
	const isDiscussionEnabled = useSetting('Discussion_enabled', true) ?? true;
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread', false) ?? false;

	const categoryList = useMemo(() => {
		if (hasLicenseModule) {
			return filterSystemCategories(
				mergeWithSectionsOrder(
					sidebarCategories.map(({ _id }) => _id),
					sidebarSectionsOrder,
				),
				{
					showOmnichannel,
					inquiriesEnabled,
					sidebarGroupByType,
					favoritesEnabled,
					sidebarShowUnread,
					isDiscussionEnabled,
				},
			);
		}

		return filterSystemCategories(sidebarSectionsOrder, {
			showOmnichannel,
			inquiriesEnabled,
			sidebarGroupByType,
			favoritesEnabled,
			sidebarShowUnread,
			isDiscussionEnabled,
		});
	}, [
		sidebarCategories,
		sidebarSectionsOrder,
		hasLicenseModule,
		showOmnichannel,
		inquiriesEnabled,
		sidebarGroupByType,
		favoritesEnabled,
		sidebarShowUnread,
		isDiscussionEnabled,
	]);

	return categoryList;
};
