import type { AtLeast, IMessage, IRoomFederated, IUser } from '@rocket.chat/core-typings';
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
	createRoom(room: IRoomFederated, owner: IUser, members: string[]): Promise<void>;
	ensureFederatedUsersExistLocally(members: (IUser | string)[]): Promise<void>;
	createDirectMessageRoom(room: IRoomFederated, members: IUser[], creatorId: IUser['_id']): Promise<void>;
	sendMessage(message: IMessage, room: IRoomFederated, user: IUser): Promise<void>;
	deleteMessage(message: IMessage): Promise<void>;
	sendReaction(messageId: string, reaction: string, user: IUser): Promise<void>;
	removeReaction(messageId: string, reaction: string, user: IUser, oldMessage: IMessage): Promise<void>;
	getEventById(eventId: string): Promise<any | null>;
	leaveRoom(rid: IRoomFederated['_id'], user: IUser): Promise<void>;
	kickUser(rid: IRoomFederated['_id'], removedUser: IUser, userWhoRemoved: IUser): Promise<void>;
	updateMessage(messageId: string, newContent: string, sender: AtLeast<IUser, '_id' | 'username'>): Promise<void>;
	updateRoomName(rid: IRoomFederated['_id'], name: string, sender: string): Promise<void>;
	updateRoomTopic(rid: IRoomFederated['_id'], topic: string, sender: string): Promise<void>;
	addUserRoleRoomScoped(
		rid: IRoomFederated['_id'],
		senderId: string,
		userId: string,
		role: 'moderator' | 'owner' | 'leader' | 'user',
	): Promise<void>;
	inviteUsersToRoom(room: IRoomFederated, usersUserName: string[], inviter: Pick<IUser, '_id' | 'username'>): Promise<void>;
	notifyUserTyping(rid: string, user: string, isTyping: boolean): Promise<void>;
}
