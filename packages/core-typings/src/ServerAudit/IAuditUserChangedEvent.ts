import type { UpdateFilter } from 'mongodb';

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
				key: 'user_data';
				value: DeepPartial<IUser>;
		  }
		| {
				key: 'operation';
				value: UpdateFilter<IUser>;
		  }
	> {
	t: 'user.changed';
}

declare module '../IServerEvent' {
	interface IServerEvents {
		'user.changed': IServerEventUserChanged;
	}
}
