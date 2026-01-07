import type { AtLeast, IRoom, ISubscription, IUser, MessageTypesValues } from '@rocket.chat/core-typings';

export interface ISubscriptionExtraData {
	open: boolean;
	ls?: Date;
	prid?: string;
	roles?: string[];
}

export interface ICreateRoomOptions extends Partial<Record<string, boolean | string | ISubscriptionExtraData>> {
	forceNew?: boolean;
	creator: string;
	subscriptionExtra?: ISubscriptionExtraData;
}

export interface ICreateRoomParams<T extends IRoom = IRoom> {
	type: IRoom['t'];
	name: IRoom['name'];
	members?: Array<string>; // member's usernames
	readOnly?: boolean;
	extraData?: Partial<T>;
	options?: ICreateRoomOptions;
}
export interface IRoomService {
	addMember(uid: string, rid: string): Promise<boolean>;
	create<T extends IRoom = IRoom>(uid: string, params: ICreateRoomParams<T>): Promise<IRoom>;
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
	performUserRemoval(room: IRoom, user: IUser, options?: { byUser?: IUser }): Promise<void>;
	performAcceptRoomInvite(room: IRoom, subscription: ISubscription, user: IUser): Promise<void>;
	removeUserFromRoom(
		roomId: string,
		user: IUser,
		options?: { byUser?: Pick<IUser, '_id' | 'username'>; skipAppPreEvents?: boolean; customSystemMessage?: MessageTypesValues },
	): Promise<void>;
	getValidRoomName(displayName: string, roomId?: string, options?: { allowDuplicates?: boolean }): Promise<string>;
	saveRoomTopic(
		roomId: string,
		roomTopic: string | undefined,
		user: Pick<IUser, 'username' | '_id' | 'federation' | 'federated'>,
		sendMessage?: boolean,
	): Promise<void>;
	getRouteLink(room: AtLeast<IRoom, '_id' | 't' | 'name'>): Promise<string | boolean>;
	join(param: { room: IRoom; user: Pick<IUser, '_id'>; joinCode?: string }): Promise<boolean | undefined>;
	beforeLeave(room: IRoom): Promise<void>;
	beforeUserRemoved(room: IRoom): Promise<void>;
	beforeNameChange(room: IRoom): Promise<void>;
	beforeTopicChange(room: IRoom): Promise<void>;
	saveRoomName(roomId: string, userId: string, name: string): Promise<void>;
	addUserRoleRoomScoped(fromUserId: string, userId: string, roomId: string, role: 'moderator' | 'owner' | 'leader' | 'user'): Promise<void>;
	createUserSubscription(params: {
		room: IRoom;
		ts: Date;
		userToBeAdded: IUser;
		inviter?: Pick<IUser, '_id' | 'username'>;
		createAsHidden?: boolean;
		skipAlertSound?: boolean;
		skipSystemMessage?: boolean;
		status?: 'INVITED';
		roles?: ISubscription['roles'];
	}): Promise<string | undefined>;
	updateDirectMessageRoomName(room: IRoom, ignoreStatusFromSubs?: string[]): Promise<boolean>;
}
