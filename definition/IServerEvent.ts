import { IUser } from './IUser';

export enum IServerEventType {
	FAILED_LOGIN_ATTEMPT = 'failed-login-attempt',
	LOGIN = 'login',
}

export interface IServerEvent {
	_id: string;
	t: IServerEventType;
	ts: Date;
	ip: string;
	u?: Partial<Pick<IUser, '_id' | 'username'>>;
}
