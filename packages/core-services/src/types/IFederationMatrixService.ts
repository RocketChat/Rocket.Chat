import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
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
	removeReaction(messageId: string, reaction: string, user: IUser): Promise<void>;
}
