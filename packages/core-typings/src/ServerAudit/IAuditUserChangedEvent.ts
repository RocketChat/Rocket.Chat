import type { UpdateFilter } from 'mongodb';

import type { IAuditServerEventType } from '../IServerEvent';
import type { IUser } from '../IUser';
import type { DeepPartial } from '../utils';

export interface IServerEventUserChanged
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
