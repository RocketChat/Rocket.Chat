import type { IUser } from './IUser';

export enum ServerEventType {
	FAILED_LOGIN_ATTEMPT = 'failed-login-attempt',
	LOGIN = 'login',
}

export interface IServerEvent {
	_id: string;
	t: ServerEventType;
	ts: Date;
	ip: string;
	u?: Partial<Pick<IUser, '_id' | 'username'>>;
}
