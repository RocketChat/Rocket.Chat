import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

export const defaultSidebarCategoryOrder = ['Teams', 'Discussions', 'Channels', 'Direct_Messages', 'Open_Livechats', 'On_Hold_Chats', 'Conversations'] as const;

type SidebarRoomGroupOptions = {
	sidebarGroupByType: boolean;
	isDiscussionEnabled: boolean;
	showOmnichannel?: boolean;
};

export const getSidebarRoomGroup = (
	room: Pick<SubscriptionWithRoom, 'category' | 't' | 'teamMain' | 'prid' | 'onHold'>,
	{ sidebarGroupByType, isDiscussionEnabled, showOmnichannel = false }: SidebarRoomGroupOptions,
): string => {
	const category = room.category?.trim();

	if (category) {
		return category;
	}

	if (!sidebarGroupByType) {
		return 'Conversations';
	}

	if (room.teamMain) {
		return 'Teams';
	}

	if (isDiscussionEnabled && room.prid) {
		return 'Discussions';
	}

	if (room.t === 'l' && room.onHold && showOmnichannel) {
		return 'On_Hold_Chats';
	}

	if (room.t === 'l' && showOmnichannel) {
		return 'Open_Livechats';
	}

	if (room.t === 'c' || room.t === 'p') {
		return 'Channels';
	}

	if (room.t === 'd') {
		return 'Direct_Messages';
	}

	return 'Conversations';
};

export const sortSidebarGroupKeys = (groupKeys: Iterable<string>, orderedKeys: readonly string[] = [], customCategoryOrder: string[] = []): string[] => {
	const availableGroupKeys = Array.from(groupKeys);

	// Built-in keys come first, ordered by orderedKeys (sidebarSectionsOrder user preference)
	const knownKeys = [...new Set(orderedKeys)].filter((key) => availableGroupKeys.includes(key));

	// Custom (user-defined) category keys — those not in the built-in default list
	const customKeys = availableGroupKeys.filter((key) => !defaultSidebarCategoryOrder.includes(key as (typeof defaultSidebarCategoryOrder)[number]) && !knownKeys.includes(key));

	// Sort custom keys according to user's saved custom category order, then alphabetically
	customKeys.sort((a, b) => {
		const aIndex = customCategoryOrder.indexOf(a);
		const bIndex = customCategoryOrder.indexOf(b);
		if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
		if (aIndex >= 0) return -1;
		if (bIndex >= 0) return 1;
		return a.localeCompare(b);
	});

	// Unknown built-in keys that weren't in orderedKeys
	const unknownBuiltinKeys = availableGroupKeys
		.filter((key) => defaultSidebarCategoryOrder.includes(key as (typeof defaultSidebarCategoryOrder)[number]) && !knownKeys.includes(key))
		.sort((a, b) => {
			const aIndex = defaultSidebarCategoryOrder.indexOf(a as (typeof defaultSidebarCategoryOrder)[number]);
			const bIndex = defaultSidebarCategoryOrder.indexOf(b as (typeof defaultSidebarCategoryOrder)[number]);
			return aIndex - bIndex;
		});

	return [...knownKeys, ...customKeys, ...unknownBuiltinKeys];
};