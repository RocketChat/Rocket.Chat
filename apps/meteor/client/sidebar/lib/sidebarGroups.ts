import type { ISidebarCategory } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import type { GroupUnreadInfo } from './unreadRooms';

/**
 * Groups the sidebar puts together on its own, from what is happening rather than from what the reader
 * arranged. They appear and disappear by themselves, so they are neither reordered nor reordered around.
 */
export const SIDEBAR_DYNAMIC_GROUP_KEYS: readonly string[] = [
	'Incoming_Calls',
	'Incoming_Livechats',
	'Open_Livechats',
	'On_Hold_Chats',
	'Unread',
];

/** A section of the room list: what it is called, what it holds, and what it is currently saying. */
export type SidebarRoomListGroup = {
	key: string;
	title: string;
	translateTitle: boolean;
	category?: ISidebarCategory;
	showUnreads: boolean;
	keepUnreadsOnTop: boolean;
	collapsed: boolean;
	rooms: SubscriptionWithRoom[];
	unreadInfo: GroupUnreadInfo;
	empty: boolean;
};
