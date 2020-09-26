import { ChangeEvent } from 'mongodb';

import { api } from '../../../../server/sdk/api';
import { IRole } from '../../../../definition/IRole';

export async function watchLoginServiceConfiguration(event: ChangeEvent<IRole>): Promise<void> {
	switch (event.operationType) {
		case 'insert':
		case 'update':
			if (!event.fullDocument) {
				return;
			}

			api.broadcast('meteor.loginServiceConfiguration', {
				action: event.operationType === 'insert' ? 'added' : 'changed',
				record: event.fullDocument,
			});
			break;
		case 'delete':
			api.broadcast('meteor.loginServiceConfiguration', {
				action: 'removed',
				record: {
					_id: event.documentKey._id,
				},
			});
			break;
	}
}
