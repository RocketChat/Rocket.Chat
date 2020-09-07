import { ChangeEvent, Collection } from 'mongodb';

import { normalize } from './utils';
import { api } from '../../../../server/sdk/api';
import { ISubscription } from '../../../../definition/ISubscription';

export function watchSubscriptions(Trash: Collection) {
	return async (event: ChangeEvent<ISubscription>): Promise<void> => {
		let subscription;
		switch (event.operationType) {
			case 'insert':
			case 'update':
				// subscription = await Subscriptions.findOne(documentKey/* , { fields }*/);
				subscription = event.fullDocument;
				break;
			case 'delete':
				subscription = await Trash.findOne<Partial<ISubscription>>(event.documentKey, { fields: { u: 1, rid: 1 } });
				break;
			default:
				return;
		}
		if (!subscription) {
			return;
		}
		api.broadcast('subscription', { action: normalize[event.operationType], subscription });
		// TODO:
		// RocketChat.Logger.info('Subscription record', fullDocument);
	};
}
