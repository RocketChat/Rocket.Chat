import { ChangeEvent } from 'mongodb';

import { normalize } from './utils';
import { IMessage } from '../../../../definition/IMessage';
import { api } from '../../../../server/sdk/api';

export async function watchMessages(event: ChangeEvent<IMessage>): Promise<void> {
	switch (event.operationType) {
		case 'insert':
		case 'update':
			// const message = await Messages.findOne(documentKey);
			const message = event.fullDocument;
			// Streamer.emitWithoutBroadcast('__my_messages__', message, {});
			api.broadcast('message', { action: normalize[event.operationType], message });
				// TODO:
				// RocketChat.Logger.info('Message record', fullDocument);
					// return Streamer[method]({ stream: STREA	M_NAMES['room-messages'], eventName: message.rid, args: message });
					// publishMessage(operationType, message);
	}
}
