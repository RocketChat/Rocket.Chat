import type { UIActionButtonContext } from './UIActionButtonContext';

export enum RoomTypeFilter {
	PUBLIC_CHANNEL = 'public_channel',
	PRIVATE_CHANNEL = 'private_channel',
	PUBLIC_TEAM = 'public_team',
	PRIVATE_TEAM = 'private_team',
	PUBLIC_DISCUSSION = 'public_discussion',
	PRIVATE_DISCUSSION = 'private_discussion',
	DIRECT = 'direct',
	DIRECT_MULTIPLE = 'direct_multiple',
	LIVE_CHAT = 'livechat',
}

export enum MessageActionContext {
	MESSAGE = 'message',
	MESSAGE_MOBILE = 'message-mobile',
	THREADS = 'threads',
	STARRED = 'starred',
}

export interface IUActionButtonWhen {
	roomTypes?: Array<RoomTypeFilter>;
	messageActionContext?: Array<MessageActionContext>;
	hasOnePermission?: Array<string>;
	hasAllPermissions?: Array<string>;
	/**
	 * Show the button when the user holds at least one of these roles.
	 *
	 * Each entry is a role id or a role name. Prefer the name for a custom role,
	 * because its id differs between workspaces.
	 *
	 * Only roles with the `Users` scope are matched. A role scoped to
	 * `Subscriptions` — `owner`, `moderator` and `leader` among them — never
	 * matches.
	 */
	hasOneRole?: Array<string>;
	/**
	 * Show the button when the user holds every one of these roles.
	 *
	 * Each entry is a role id or a role name. Prefer the name for a custom role,
	 * because its id differs between workspaces.
	 *
	 * Only roles with the `Users` scope are matched. A role scoped to
	 * `Subscriptions` — `owner`, `moderator` and `leader` among them — never
	 * matches.
	 */
	hasAllRoles?: Array<string>;
}

export interface IUIActionButtonDescriptor {
	actionId: string;
	context: UIActionButtonContext;
	labelI18n: string;
	variant?: 'danger';
	when?: IUActionButtonWhen;
	category?: 'default' | 'ai';
}
export interface IUIActionButton extends IUIActionButtonDescriptor {
	appId: string;
}
