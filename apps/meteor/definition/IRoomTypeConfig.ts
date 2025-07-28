import type {
	IRoom,
	RoomType,
	IUser,
	IMessage,
	ReadReceipt,
	ValueOf,
	AtLeast,
	ISubscription,
	IOmnichannelRoom,
} from '@rocket.chat/core-typings';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { IRouterPaths, RouteName } from '@rocket.chat/ui-contexts';

export type RoomIdentification = { rid?: IRoom['_id']; name?: string; tab?: string };

export interface IRoomTypeRouteConfig<TRouteName extends RouteName> {
	name: TRouteName;
	path?: IRouterPaths[TRouteName]['pattern'];
	link?: (data: RoomIdentification) => Record<string, string>;
}

export const RoomSettingsEnum = {
	TYPE: 'type',
	NAME: 'roomName',
	TOPIC: 'roomTopic',
	ANNOUNCEMENT: 'roomAnnouncement',
	DESCRIPTION: 'roomDescription',
	READ_ONLY: 'readOnly',
	REACT_WHEN_READ_ONLY: 'reactWhenReadOnly',
	ARCHIVE_OR_UNARCHIVE: 'archiveOrUnarchive',
	JOIN_CODE: 'joinCode',
	BROADCAST: 'broadcast',
	SYSTEM_MESSAGES: 'systemMessages',
	E2E: 'encrypted',
} as const;

export const RoomMemberActions = {
	ARCHIVE: 'archive',
	IGNORE: 'ignore',
	BLOCK: 'block',
	MUTE: 'mute',
	SET_AS_OWNER: 'setAsOwner',
	SET_AS_LEADER: 'setAsLeader',
	SET_AS_MODERATOR: 'setAsModerator',
	LEAVE: 'leave',
	REMOVE_USER: 'removeUser',
	JOIN: 'join',
	INVITE: 'invite',
} as const;

export const UiTextContext = {
	HIDE_WARNING: 'hideWarning',
	LEAVE_WARNING: 'leaveWarning',
} as const;

export interface IRoomTypeConfig {
	identifier: string;
	route?: IRoomTypeRouteConfig<RouteName>;
}

export interface IRoomTypeClientConfig extends IRoomTypeConfig {
	label?: string;
}

export interface IRoomTypeClientDirectives {
	config: IRoomTypeClientConfig;

	allowRoomSettingChange: (room: Partial<IRoom>, setting: ValueOf<typeof RoomSettingsEnum>) => boolean;
	allowMemberAction: (
		room: Partial<IRoom>,
		action: ValueOf<typeof RoomMemberActions>,
		userId: IUser['_id'],
		userSubscription?: ISubscription,
	) => boolean;
	roomName: (room: AtLeast<IRoom, '_id' | 'name' | 'fname' | 'prid'>) => string | undefined;
	isGroupChat: (room: Partial<IRoom>) => boolean;
	getUiText: (context: ValueOf<typeof UiTextContext>) => string;
	condition: () => boolean;
	getAvatarPath: (
		room: Pick<IRoom, '_id' | 'name' | 'fname' | 'prid' | 'avatarETag' | 'uids' | 'usernames'> & { username?: IRoom['_id'] },
	) => string;
	getIcon?: (room: Partial<IRoom>) => IconName;
	extractOpenRoomParams?: (routeParams: Record<string, string | null | undefined>) => { type: RoomType; reference: string };
	findRoom: (identifier: string) => IRoom | undefined;
	showJoinLink: (roomId: string) => boolean;
	isLivechatRoom: () => boolean;
	canSendMessage: (rid: string) => boolean;
	readOnly?: (rid: string, user: AtLeast<IUser, 'username'>) => boolean;
}

export interface IRoomTypeServerDirectives {
	config: IRoomTypeConfig;

	allowRoomSettingChange: (room: IRoom, setting: ValueOf<typeof RoomSettingsEnum>) => boolean;
	allowMemberAction: (room: IRoom, action: ValueOf<typeof RoomMemberActions>, userId?: IUser['_id']) => Promise<boolean>;
	roomName: (room: IRoom, userId?: string) => Promise<string | undefined>;
	isGroupChat: (room: IRoom) => boolean;
	canBeDeleted: (hasPermission: (permissionId: string, rid?: string) => Promise<boolean> | boolean, room: IRoom) => Promise<boolean>;
	preventRenaming: () => boolean;
	getDiscussionType: (room?: AtLeast<IRoom, 'teamId'>) => Promise<RoomType>;
	canAccessUploadedFile: (params: { rc_uid: string; rc_rid: string; rc_token: string }) => Promise<boolean>;
	getNotificationDetails: (
		room: IRoom,
		sender: AtLeast<IUser, '_id' | 'name' | 'username'>,
		notificationMessage: string,
		userId: string,
	) => Promise<{ title: string | undefined; text: string; name: string | undefined }>;
	getMsgSender: (message: IMessage) => Promise<IUser | null>;
	includeInRoomSearch: () => boolean;
	getReadReceiptsExtraData: (message: IMessage) => Partial<ReadReceipt>;
	includeInDashboard: () => boolean;
	roomFind?: (rid: string) => Promise<IRoom | undefined> | Promise<IOmnichannelRoom | null> | IRoom | undefined;
}
