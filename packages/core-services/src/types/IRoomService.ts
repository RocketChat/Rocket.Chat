import type { IRoom, IUser } from '@rocket.chat/core-typings';

export interface ISubscriptionExtraData {
	open: boolean;
	ls?: Date;
	prid?: string;
}

interface ICreateRoomOptions extends Partial<Record<string, string | ISubscriptionExtraData>> {
	nameValidationRegex?: string;
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
}

export interface ICreateDiscussionParams {
	parentRoomId: string;
	parentMessageId: string;
	creatorId: string;
	name: string;
	members: Array<string>;
	encrypted?: boolean;
	reply?: string;
}

export interface IRoomService {
	addMember(uid: string, rid: string): Promise<boolean>;
	create(uid: string, params: ICreateRoomParams): Promise<IRoom>;
	createDiscussion(params: ICreateDiscussionParams): Promise<IRoom>;
	addUserToRoom(
		rid: string,
		user: Pick<IUser, '_id' | 'username'> | string,
		inviter?: Pick<IUser, '_id' | 'username'>,
		silenced?: boolean,
	): Promise<boolean | unknown>;
	createDirectMessage(data: { to: string; from: string }): Promise<{ rid: string }>;
}
