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
	hasOneRole?: Array<string>;
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
