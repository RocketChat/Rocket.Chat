import { ChangeEvent } from 'mongodb';

import { normalize } from './utils';
import { IUser } from '../../../../definition/IUser';
import { api } from '../../../../server/sdk/api';

export async function watchUsers(event: ChangeEvent<IUser>): Promise<void> {
	switch (event.operationType) {
		case 'insert':
		case 'update':
			const { updatedFields } = 'updateDescription' in event ? event.updateDescription : { updatedFields: undefined };
			// const message = await Messages.findOne(documentKey);
			const user = event.fullDocument;

			if (!user) {
				break;
			}

			// Streamer.emitWithoutBroadcast('__my_messages__', message, {});
			if (updatedFields) {
				if (updatedFields.status || updatedFields.statusText) {
					const { status, _id, username, statusText } = user; // remove username
					api.broadcast('userpresence', { action: normalize[event.operationType], user: { status, _id, username, statusText } }); // remove username
					// RocketChat.Logger.info('User: userpresence', { status, _id, username, statusText });
				}
			}

			// RocketChat.Logger.info('User record', user);
			// return Streamer[method]({ stream: STREAM_NAMES['room-messages'], eventName: message.rid, args: message });
			// publishMessage(operationType, message);
	}
}
