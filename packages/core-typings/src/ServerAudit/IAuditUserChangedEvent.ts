import type { IAuditServerEventType } from '../IServerEvent';
import type { IUser } from '../IUser';
import type { DeepPartial } from '../utils';

export type IServerEventAuditedUser = IUser & {
	password: string;
};

interface IServerEventUserChanged
	extends IAuditServerEventType<
		| {
				key: 'user';
				value: {
					_id: IUser['_id'];
					username: IUser['username'];
				};
		  }
		| {
				key: 'previous';
				value: Partial<DeepPartial<IServerEventAuditedUser>>;
		  }
		| {
				key: 'current';
				value: Partial<IServerEventAuditedUser>;
		  }
	> {
	t: 'user.changed';
}

declare module '../IServerEvent' {
	interface IServerEvents {
		'user.changed': IServerEventUserChanged;
	}
}
