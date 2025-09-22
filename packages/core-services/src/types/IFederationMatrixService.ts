import type { IMessage, IRoomFederated, IRoomNativeFederated, IUser } from '@rocket.chat/core-typings';
import type { Router } from '@rocket.chat/http-router';

export interface IRouteContext {
	params: any;
	query: any;
	body: any;
	headers: Record<string, string>;
	setStatus: (code: number) => void;
	setHeader: (key: string, value: string) => void;
}

export interface IFederationMatrixService {
	getAllRoutes(): {
		matrix: Router<'/_matrix'>;
		wellKnown: Router<'/.well-known'>;
	};
	createRoom(room: IRoomFederated, owner: IUser, members: string[]): Promise<{ room_id: string; event_id: string } | undefined>;
	ensureFederatedUsersExistLocally(members: (IUser | string)[]): Promise<void>;
	createDirectMessageRoom(room: IRoomFederated, members: IUser[], creatorId: IUser['_id']): Promise<void>;
	sendMessage(message: IMessage, room: IRoomFederated, user: IUser): Promise<void>;
	deleteMessage(matrixRoomId: string, message: IMessage): Promise<void>;
	sendReaction(messageId: string, reaction: string, user: IUser): Promise<void>;
	removeReaction(messageId: string, reaction: string, user: IUser, oldMessage: IMessage): Promise<void>;
	getEventById(eventId: string): Promise<any | null>;
	leaveRoom(rid: IRoomFederated['_id'], user: IUser): Promise<void>;
	kickUser(room: IRoomNativeFederated, removedUser: IUser, userWhoRemoved: IUser): Promise<void>;
	updateMessage(room: IRoomNativeFederated, message: IMessage): Promise<void>;
	updateRoomName(rid: string, displayName: string, user: IUser): Promise<void>;
	updateRoomTopic(room: IRoomNativeFederated, topic: string, user: IUser): Promise<void>;
	addUserRoleRoomScoped(
		room: IRoomNativeFederated,
		senderId: string,
		userId: string,
		role: 'moderator' | 'owner' | 'leader' | 'user',
	): Promise<void>;
	inviteUsersToRoom(room: IRoomFederated, usersUserName: string[], inviter: Pick<IUser, '_id' | 'username'>): Promise<void>;
	notifyUserTyping(rid: string, user: string, isTyping: boolean): Promise<void>;
}
