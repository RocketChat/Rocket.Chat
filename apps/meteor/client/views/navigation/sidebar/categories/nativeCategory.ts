import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

type NativeKeyMap = {
	teams: string;
	channels: string;
	direct: string;
	conversations: string;
	discussions?: string;
};

/** System group keys for the classic sidebar (`useRoomList`). */
export const CLASSIC_NATIVE_KEYS: NativeKeyMap = {
	teams: 'Teams',
	discussions: 'Discussions',
	channels: 'Channels',
	direct: 'Direct_Messages',
	conversations: 'Conversations',
};

/** System group keys for the navigation sidebar (`collapsibleFilters`). */
export const NAVIGATION_NATIVE_KEYS: NativeKeyMap = {
	teams: 'teams',
	channels: 'channels',
	direct: 'directMessages',
	conversations: 'conversations',
};

/**
 * The system group a room belongs to when it is NOT in a custom category — its "native" category.
 * Mirrors the sidebar grouping rules so a room can be dragged back to where it would otherwise live.
 */
export const getNativeCategoryKey = (
	room: SubscriptionWithRoom,
	{ groupByType, discussionEnabled, keys }: { groupByType: boolean; discussionEnabled?: boolean; keys: NativeKeyMap },
): string => {
	if (!groupByType) {
		return keys.conversations;
	}
	if (room.teamMain) {
		return keys.teams;
	}
	if (discussionEnabled && room.prid && keys.discussions) {
		return keys.discussions;
	}
	if (room.t === 'c' || room.t === 'p') {
		return keys.channels;
	}
	if (room.t === 'd') {
		return keys.direct;
	}
	return keys.conversations;
};
