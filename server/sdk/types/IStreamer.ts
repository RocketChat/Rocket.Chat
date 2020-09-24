import { IServiceClass } from './ServiceClass';

export enum STATUS_MAP {
	OFFLINE = 0,
	ONLINE = 1,
	AWAY = 2,
	BUDY = 3,
}

export interface IStreamer extends IServiceClass {
	notifyAll(eventName: string, ...args: any[]): void;
	notifyUser(uid: string, eventName: string, ...args: any[]): void;
	sendUserStatus({ uid, username, status, statusText }: { uid: string; username: string; status: STATUS_MAP; statusText?: string }): void;
}
