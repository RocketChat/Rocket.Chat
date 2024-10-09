import type { IMessage, MessageTypesValues } from './IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser, Username } from './IUser';
import type { RoomType } from './RoomType';

type CallStatus = 'ringing' | 'ended' | 'declined' | 'ongoing';
const sidepanelItemValues = ['channels', 'discussions'] as const;
export type SidepanelItem = (typeof sidepanelItemValues)[number];

export type RoomID = string;
export type ChannelName = string;

export interface IRoom extends IRocketChatRecord {
	_id: RoomID;
	t: RoomType;
	name?: string;
	fname?: string;
	msgs: number;
	default?: boolean;
	broadcast?: true;
	featured?: true;
	announcement?: string;
	joinCodeRequired?: boolean;
	announcementDetails?: {
		style?: string;
	};
	encrypted?: boolean;
	topic?: string;

	reactWhenReadOnly?: boolean;

	// TODO: this boolean might be an accident
	sysMes?: MessageTypesValues[] | boolean;

	u: Pick<IUser, '_id' | 'username' | 'name'>;
	uids?: Array<string>;

	lastMessage?: IMessage;
	lm?: Date;
	usersCount: number;
	callStatus?: CallStatus;
	webRtcCallStartTime?: Date;
	servedBy?: {
		_id: string;
	};

	prid?: string;
	avatarETag?: string;

	teamMain?: boolean;
	teamId?: string;
	teamDefault?: boolean;
	open?: boolean;

	autoTranslateLanguage?: string;
	autoTranslate?: boolean;
	unread?: number;
	alert?: boolean;
	hideUnreadStatus?: boolean;
	hideMentionStatus?: boolean;

	muted?: string[];
	unmuted?: string[];

	usernames?: string[];
	ts?: Date;

	cl?: boolean;
	ro?: boolean;
	favorite?: boolean;
	archived?: boolean;
	description?: string;
	createdOTR?: boolean;
	e2eKeyId?: string;

	/* @deprecated */
	federated?: boolean;
	/* @deprecated */
	customFields?: Record<string, any>;

	usersWaitingForE2EKeys?: { userId: IUser['_id']; ts: Date }[];

	sidepanel?: {
		items: [SidepanelItem, SidepanelItem?];
	};
}

export const isSidepanelItem = (item: any): item is SidepanelItem => {
	return sidepanelItemValues.includes(item);
};

export const isValidSidepanel = (sidepanel: IRoom['sidepanel']) => {
	if (sidepanel === null) {
		return true;
	}
	if (!sidepanel?.items) {
		return false;
	}
	return (
		Array.isArray(sidepanel.items) &&
		sidepanel.items.length &&
		sidepanel.items.every(isSidepanelItem) &&
		sidepanel.items.length === new Set(sidepanel.items).size
	);
};

export const isRoomWithJoinCode = (room: Partial<IRoom>): room is IRoomWithJoinCode =>
	'joinCodeRequired' in room && (room as any).joinCodeRequired === true;

export interface IRoomWithJoinCode extends IRoom {
	joinCodeRequired: true;
	joinCode: string;
}

export interface IRoomFederated extends IRoom {
	federated: true;
}

export const isRoomFederated = (room: Partial<IRoom>): room is IRoomFederated => 'federated' in room && (room as any).federated === true;
export interface ICreatedRoom extends IRoom {
	rid: string;
	inserted: boolean;
}

export interface ITeamRoom extends IRoom {
	teamMain: boolean;
	teamId: string;
}

export const isTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => !!room.teamMain;
export const isPrivateTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => isTeamRoom(room) && room.t === 'p';
export const isPublicTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => isTeamRoom(room) && room.t === 'c';

export const isDiscussion = (room: Partial<IRoom>): room is IRoom => !!room.prid;
export const isPrivateDiscussion = (room: Partial<IRoom>): room is IRoom => isDiscussion(room) && room.t === 'p';
export const isPublicDiscussion = (room: Partial<IRoom>): room is IRoom => isDiscussion(room) && room.t === 'c';

export const isPublicRoom = (room: Partial<IRoom>): room is IRoom => room.t === 'c';
export const isPrivateRoom = (room: Partial<IRoom>): room is IRoom => room.t === 'p';

export interface IDirectMessageRoom extends Omit<IRoom, 'default' | 'featured' | 'u' | 'name'> {
	t: 'd';
	uids: Array<string>;
	usernames: Array<Username>;
}

export const isDirectMessageRoom = (room: Partial<IRoom> | IDirectMessageRoom): room is IDirectMessageRoom => room.t === 'd';
export const isMultipleDirectMessageRoom = (room: IRoom | IDirectMessageRoom): room is IDirectMessageRoom =>
	isDirectMessageRoom(room) && room.uids.length > 2;

export type RoomAdminFieldsType =
	| '_id'
	| 'prid'
	| 'fname'
	| 'name'
	| 't'
	| 'cl'
	| 'u'
	| 'usernames'
	| 'ts'
	| 'usersCount'
	| 'muted'
	| 'unmuted'
	| 'ro'
	| 'default'
	| 'favorite'
	| 'featured'
	| 'reactWhenReadOnly'
	| 'topic'
	| 'msgs'
	| 'archived'
	| 'teamId'
	| 'teamMain'
	| 'announcement'
	| 'description'
	| 'broadcast'
	| 'uids'
	| 'avatarETag';

export interface IRoomWithRetentionPolicy extends IRoom {
	retention: {
		enabled?: boolean;
		maxAge: number;
		filesOnly: boolean;
		excludePinned: boolean;
		ignoreThreads: boolean;
		overrideGlobal?: boolean;
	};
}
