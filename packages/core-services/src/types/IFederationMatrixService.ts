import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

export interface IFederationMatrixService {
	ping(): void;
	getWellKnownHostData(): Promise<{ 'm.server': string }>;
	queryProfile(userId: string): Promise<{ avatar_url: string; displayname: string }>;
	createRoom(room: IRoom, owner: IUser, members: string[]): Promise<void>;
	sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void>;
}
