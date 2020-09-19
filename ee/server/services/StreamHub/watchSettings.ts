import { ChangeEvent } from 'mongodb';

import { normalize } from './utils';
import { api } from '../../../../server/sdk/api';
import { ISetting } from '../../../../definition/ISetting';

export async function watchSettings(event: ChangeEvent<ISetting>): Promise<void> {
	if ('updateDescription' in event && event.updateDescription.updatedFields._updatedAt) {
		return;
	}
	let setting;
	switch (event.operationType) {
		case 'insert':
		case 'update':
			// setting = Settings.findOne(documentKey/* , { fields }*/);
			setting = event.fullDocument;
			break;
		case 'delete':
			setting = event.documentKey;
			break;
		default:
			return;
	}

	if (!setting) {
		return;
	}

	api.broadcast('setting', { action: normalize[event.operationType], setting });
	// RocketChat.Notifications.streamUser.__emit(data._id, operationType, data);
	// RocketChat.Logger.info('Settings record', setting);
}
