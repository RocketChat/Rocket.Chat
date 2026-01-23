import type { IUser } from './IUser';

export enum ServerEventType {
	FAILED_LOGIN_ATTEMPT = 'failed-login-attempt',
	LOGIN = 'login',
}

export interface IServerEvent {
	_id: string;
	t: ServerEventType | keyof IServerEvents;
	ts: Date;

	// @deprecated
	ip: string;
	// @deprecated
	u?: Partial<Pick<IUser, '_id' | 'username'>>;

	actor?: IAuditServerActor;

	data?: AuditServerEventPayloadItem[];
}

export interface IAuditServerUserActor {
	type: 'user';
	_id: string;
	username: string;
	ip: string;
	useragent: string;
}

export interface IAuditServerSystemActor {
	type: 'system';
	reason?: string;
}

export interface IAuditServerAppActor {
	type: 'app';
	_id: string;
	reason?: string;
}

export type IAuditServerActor = IAuditServerUserActor | IAuditServerSystemActor | IAuditServerAppActor;

interface IAuditServerEvent {
	_id: string;
	t: string;
	ts: Date;
	actor: IAuditServerActor;
}

type AuditServerEventPayloadItem = {
	key: string;
	value: unknown;
};

export interface IAuditServerEventType<E extends AuditServerEventPayloadItem> extends IAuditServerEvent {
	data: E[];
}

export interface IServerEvents {}

type KeyValuePair = { key: string; value: any };

type ArrayToObject<T extends readonly KeyValuePair[]> = {
	[K in T[number] as K['key']]: K['value'];
};

export type ExtractDataToParams<T extends IAuditServerEventType<any>> =
	T extends IAuditServerEventType<any> ? ArrayToObject<T['data']> : never;
