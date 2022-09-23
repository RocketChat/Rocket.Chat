import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { NotificationQueue, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../lib/callbacks';

export async function readMessages(rid: IRoom['_id'], uid: IUser['_id'], readThreads: boolean): Promise<void> {
	callbacks.run('beforeReadMessages', rid, uid);

	const projection = { ls: 1, tunread: 1, alert: 1 };
	const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid, { projection });
	if (!sub) {
		throw new Error('error-invalid-subscription');
	}

	await Subscriptions.setAsReadByRoomIdAndUserId(rid, uid, readThreads);

	await NotificationQueue.clearQueueByUserId(uid);

	callbacks.runAsync('afterReadMessages', rid, { uid, lastSeen: sub.ls });
}
