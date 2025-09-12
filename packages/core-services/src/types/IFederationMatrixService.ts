import type { AtLeast, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
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
	createRoom(room: IRoom, owner: IUser, members: string[]): Promise<void>;
	ensureFederatedUsersExistLocally?(members: IUser[] | string[]): Promise<void>;
	createDirectMessageRoom(room: IRoom, members: IUser[], creatorId: IUser['_id']): Promise<void>;
	sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void>;
	deleteMessage(message: IMessage): Promise<void>;
	sendReaction(messageId: string, reaction: string, user: IUser): Promise<void>;
	removeReaction(messageId: string, reaction: string, user: IUser, oldMessage: IMessage): Promise<void>;
	getEventById(eventId: string): Promise<any | null>;
	leaveRoom(roomId: string, user: IUser): Promise<void>;
	kickUser(roomId: string, removedUser: IUser, userWhoRemoved: IUser): Promise<void>;
	updateMessage(messageId: string, newContent: string, sender: AtLeast<IUser, '_id' | 'username'>): Promise<void>;
	updateRoomName(roomId: string, name: string, sender: string): Promise<void>;
	updateRoomTopic(roomId: string, topic: string, sender: string): Promise<void>;
	addUserRoleRoomScoped(rid: string, senderId: string, userId: string, role: 'moderator' | 'owner' | 'leader' | 'user'): Promise<void>;
	inviteUsersToRoom(room: IRoom, usersUserName: string[], inviter: IUser): Promise<void>;
}
