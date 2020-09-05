import { ChangeEvent } from 'mongodb';

import { api } from '../../../../server/sdk/api';
import { IRole } from '../../../../definition/IRole';

export async function watchRoles(event: ChangeEvent<IRole>): Promise<void> {
	// TODO:
	// RocketChat.Logger.info('Role record', documentKey);
	switch (event.operationType) {
		case 'insert':
		case 'update':
			api.broadcast('role', {
				type: 'changed',
				...event.fullDocument,
			});
			break;
		case 'delete':
			api.broadcast('role', {
				type: 'removed',
				name: event.documentKey._id,
			});
			break;
	}
}
