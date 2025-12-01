import type { IMessage, IRoomFederated, IRoomNativeFederated, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { EventStore } from '@rocket.chat/federation-sdk';

export interface IFederationMatrixService {
	createRoom(room: IRoomFederated, owner: IUser): Promise<{ room_id: string; event_id: string }>;
	ensureFederatedUsersExistLocally(members: string[]): Promise<void>;
	createDirectMessageRoom(room: IRoomFederated, members: IUser[], creatorId: IUser['_id']): Promise<void>;
	sendMessage(message: IMessage, room: IRoomFederated, user: IUser): Promise<void>;
	deleteMessage(matrixRoomId: string, message: IMessage): Promise<void>;
	sendReaction(messageId: string, reaction: string, user: IUser): Promise<void>;
	removeReaction(messageId: string, reaction: string, user: IUser, oldMessage: IMessage): Promise<void>;
	getEventById(eventId: string): Promise<EventStore | null>;
	leaveRoom(rid: IRoomFederated['_id'], user: IUser, kicker?: IUser): Promise<void>;
	kickUser(room: IRoomNativeFederated, removedUser: IUser, userWhoRemoved: IUser): Promise<void>;
	updateMessage(room: IRoomNativeFederated, message: IMessage): Promise<void>;
	updateRoomName(rid: string, displayName: string, user: IUser): Promise<void>;
	updateRoomTopic(
		room: IRoomNativeFederated,
		topic: string,
		user: Pick<IUser, '_id' | 'username' | 'federation' | 'federated'>,
	): Promise<void>;
	addUserRoleRoomScoped(
		room: IRoomNativeFederated,
		senderId: string,
		userId: string,
		role: 'moderator' | 'owner' | 'leader' | 'user',
	): Promise<void>;
	inviteUsersToRoom(room: IRoomFederated, usersUserName: string[], inviter: IUser): Promise<void>;
	notifyUserTyping(rid: string, user: string, isTyping: boolean): Promise<void>;
	verifyMatrixIds(matrixIds: string[]): Promise<{ [key: string]: string }>;
	handleInvite(subscriptionId: ISubscription['_id'], userId: IUser['_id'], action: 'accept' | 'reject'): Promise<void>;
}
