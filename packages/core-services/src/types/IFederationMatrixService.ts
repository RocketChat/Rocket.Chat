import type express from 'express';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

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
		matrix: express.Router;
		wellKnown: express.Router; 
	};
	createRoom(room: IRoom, owner: IUser, members: string[]): Promise<void>;
	sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void>;
}
