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
	sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void>;
	sendReaction(messageId: string, reaction: string, user: IUser): Promise<void>;
	removeReaction(messageId: string, reaction: string, user: IUser, oldMessage: IMessage): Promise<void>;
	getEventById(eventId: string): Promise<any | null>;
	updateRoomName(rid: string, displayName: string, senderId: string): Promise<void>;
	leaveRoom(roomId: string, user: IUser): Promise<void>;
	kickUser(roomId: string, removedUser: IUser, userWhoRemoved: IUser): Promise<void>;
	updateMessage(messageId: string, newContent: string, sender: AtLeast<IUser, '_id' | 'username'>): Promise<void>;
	setRoomPrivacy(roomId: string, privacy: IRoom['t'], senderId: string): Promise<void>;

	setUserModerator(fromUserId: string, userId: string, roomId: string, role: 'owner' | 'moderator' | 'user'): Promise<void>;

	deleteMessage(message: IMessage, user: IUser): Promise<void>;
}
