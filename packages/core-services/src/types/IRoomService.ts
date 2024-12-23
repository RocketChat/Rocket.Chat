import type { AtLeast, IRoom, IUser } from '@rocket.chat/core-typings';

export interface ISubscriptionExtraData {
	open: boolean;
	ls?: Date;
	prid?: string;
	roles?: string[];
}

interface ICreateRoomOptions extends Partial<Record<string, string | ISubscriptionExtraData>> {
	creator: string;
	subscriptionExtra?: ISubscriptionExtraData;
}

export interface ICreateRoomExtraData extends Record<string, string | boolean> {
	teamId: string;
	teamMain: boolean;
}

export interface ICreateRoomParams {
	type: IRoom['t'];
	name: IRoom['name'];
	members?: Array<string>; // member's usernames
	readOnly?: boolean;
	extraData?: Partial<ICreateRoomExtraData>;
	options?: ICreateRoomOptions;
	sidepanel?: IRoom['sidepanel'];
}
export interface IRoomService {
	addMember(uid: string, rid: string): Promise<boolean>;
	create(uid: string, params: ICreateRoomParams): Promise<IRoom>;
	createDirectMessage(data: { to: string; from: string }): Promise<{ rid: string }>;
	createDirectMessageWithMultipleUsers(members: string[], creatorId: string): Promise<{ rid: string }>;
	addUserToRoom(
		roomId: string,
		user: Pick<IUser, '_id'> | string,
		inviter?: Pick<IUser, '_id' | 'username'>,
		options?: {
			skipSystemMessage?: boolean;
			skipAlertSound?: boolean;
			createAsHidden?: boolean;
		},
	): Promise<boolean | undefined>;
	removeUserFromRoom(roomId: string, user: IUser, options?: { byUser: Pick<IUser, '_id' | 'username'> }): Promise<void>;
	getValidRoomName(displayName: string, roomId?: string, options?: { allowDuplicates?: boolean }): Promise<string>;
	saveRoomTopic(
		roomId: string,
		roomTopic: string | undefined,
		user: {
			username: string;
			_id: string;
		},
		sendMessage?: boolean,
	): Promise<void>;
	getRouteLink(room: AtLeast<IRoom, '_id' | 't' | 'name'>): Promise<string | boolean>;
	join(param: { room: IRoom; user: Pick<IUser, '_id'>; joinCode?: string }): Promise<boolean | undefined>;
	beforeLeave(room: IRoom): Promise<void>;
	beforeUserRemoved(room: IRoom): Promise<void>;
	beforeNameChange(room: IRoom): Promise<void>;
	beforeTopicChange(room: IRoom): Promise<void>;
}
