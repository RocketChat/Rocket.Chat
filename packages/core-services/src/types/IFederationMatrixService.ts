import type {
	IMatrixRTCMembership,
	IMessage,
	IRoomFederated,
	IRoomNativeFederated,
	ISubscription,
	IUser,
	IVideoConference,
} from '@rocket.chat/core-typings';
import type { EventID, EventStore, PduForType } from '@rocket.chat/federation-sdk';

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
	banUser(room: IRoomNativeFederated, bannedUser: IUser, userWhoBanned: IUser): Promise<void>;
	unbanUser(room: IRoomNativeFederated, unbannedUser: IUser, userWhoUnbanned: IUser): Promise<void>;
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
	verifyMatrixIds(matrixIds: string[]): Promise<{ [key: string]: string }>;
	handleInvite(subscriptionId: ISubscription['_id'], userId: IUser['_id'], action: 'accept' | 'reject'): Promise<void>;
	canUserAccessFederation(user: IUser): Promise<boolean>;
	notifyRoomRead(params: { room: IRoomNativeFederated; userId: string; threadId?: string }): Promise<void>;
	updateUserName(user: IUser): Promise<void>;
	joinAppServiceRoom(roomAlias: string, user: IUser): Promise<boolean>;
	saveFederationMessage(event: { event: PduForType<'m.room.message'>; event_id: EventID }): Promise<void>;
	/**
	 * Announces in the room that one of this server's users is in a federated conference, or confirms the
	 * announcement still stands, and returns the membership. Safe to repeat on every join and every token request.
	 */
	joinRTCSession(call: IVideoConference, user: IUser): Promise<IMatrixRTCMembership>;
	/** Announces in the room that one of this server's users left a federated conference. */
	leaveRTCSession(call: IVideoConference, uid: IUser['_id']): Promise<void>;
	/** Rings, or tells about the call, the members of other servers through the room. */
	notifyRTCSession(call: IVideoConference, caller: IUser, targets: IUser[], kind: 'ring' | 'notification'): Promise<void>;
	/** Turns down, for one of this server's users, a ring that came from another server. */
	declineRTCSession(call: IVideoConference, user: IUser): Promise<void>;
	/** A token for one of this server's users to watch, on another homeserver's SFU, the members it hosts. */
	getRemoteLiveKitToken(
		call: IVideoConference,
		user: IUser,
		serverName: string,
		transport: string,
	): Promise<{ serverUrl: string; token: string }>;
}
