/**
 * Built-in sidebar section keys. These keys are reserved as i18n labels for
 * Rocket.Chat's standard sidebar groups (Channels, Direct Messages, etc.) and
 * must not be reused as user-defined room category names — otherwise a user
 * category would either silently overwrite the built-in section, or be
 * filtered out and its rooms would disappear from the sidebar.
 *
 * Imported by both the sidebar (client) and the user-room-categories API
 * (server) so the rule has a single source of truth.
 */
export const SIDEBAR_BUILTIN_GROUP_ORDER = [
	'Incoming_Calls',
	'Incoming_Livechats',
	'Open_Livechats',
	'On_Hold_Chats',
	'Unread',
	'Drafts',
	'Favorites',
	'Teams',
	'Discussions',
	'Channels',
	'Direct_Messages',
	'Conversations',
] as const;

export const SIDEBAR_BUILTIN_GROUP_KEYS: ReadonlySet<string> = new Set<string>(SIDEBAR_BUILTIN_GROUP_ORDER);

export const isReservedSidebarGroupName = (name: string): boolean => SIDEBAR_BUILTIN_GROUP_KEYS.has(name);
