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
	hasOnePermission?: Array<string>;
	hasAllPermissions?: Array<string>;
	/**
	 * Show the button when the user holds at least one of these roles.
	 *
	 * Each entry is a role id or a role name. Prefer the name for a custom role,
	 * because its id differs between workspaces.
	 *
	 * A role scoped to `Subscriptions` — `owner`, `moderator`, `leader`, or a custom
	 * one — is granted per room, so it matches only on surfaces bound to a room. On a
	 * surface with no room of its own, the user dropdown for instance, only roles
	 * scoped to `Users` match.
	 */
	hasOneRole?: Array<string>;
	/**
	 * Show the button when the user holds every one of these roles.
	 *
	 * Each entry is a role id or a role name. Prefer the name for a custom role,
	 * because its id differs between workspaces.
	 *
	 * A role scoped to `Subscriptions` — `owner`, `moderator`, `leader`, or a custom
	 * one — is granted per room, so it matches only on surfaces bound to a room. On a
	 * surface with no room of its own, the user dropdown for instance, only roles
	 * scoped to `Users` match.
	 */
	hasAllRoles?: Array<string>;
}

export type IUIActionButtonDescriptorBase = {
	actionId: string;
	labelI18n: string;
	variant?: 'danger';
	category?: 'default' | 'ai';
};

export type IUIActionButtonDescriptorDefault<K extends string> = IUIActionButtonDescriptorBase & {
	context: K;
	when?: IUActionButtonWhen;
};

export type MessageBoxActionButton = IUIActionButtonDescriptorDefault<'messageBoxAction'>;

export type UserDropdownActionButton = IUIActionButtonDescriptorDefault<'userDropdownAction'>;

export type RoomSideBarActionButton = IUIActionButtonDescriptorDefault<'roomSideBarAction'>;

export type MessageActionButton = IUIActionButtonDescriptorBase & {
	context: 'messageAction';
	when?: IUActionButtonWhen & { messageActionContext?: MessageActionContext[] };
};

export type RoomActionButton = IUIActionButtonDescriptorBase & {
	context: 'roomAction';
	when?: IUActionButtonWhen & { roomTypes?: RoomTypeFilter[] };
};

export interface IUIActionButtonDescriptorMap {
	messageBoxAction: MessageBoxActionButton;
	userDropdownAction: UserDropdownActionButton;
	roomSideBarAction: RoomSideBarActionButton;
	messageAction: MessageActionButton;
	roomAction: RoomActionButton;
}

export type IUIActionButtonDescriptor = {
	[K in keyof IUIActionButtonDescriptorMap]: IUIActionButtonDescriptorMap[K];
}[keyof IUIActionButtonDescriptorMap];

export type UIActionButtonAvailableContexts = `${IUIActionButtonDescriptorMap[keyof IUIActionButtonDescriptorMap]['context']}`;

export type IUIActionButton = IUIActionButtonDescriptor & { appId: string };
