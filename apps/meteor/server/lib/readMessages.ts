import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { NotificationQueue, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../lib/callbacks';
import { canAccessRoomIdAsync } from '../../app/authorization/server';

export async function readMessages(rid: IRoom['_id'], uid: IUser['_id'], readThreads: boolean): Promise<void> {
	callbacks.run('beforeReadMessages', rid, uid);

	if (!(await canAccessRoomIdAsync(rid, uid))) {
		throw new Error('error-not-allowed');
	}

	const projection = { ls: 1, tunread: 1, alert: 1 };
	const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid, { projection });
	if (!sub) {
		throw new Error('error-invalid-subscription');
	}

	if (readThreads) {
		await Subscriptions.setAsReadByRoomIdAndUserId(rid, uid);
	} else {
		// do not mark room as read if there are still unread threads
		const alert = sub.alert && sub.tunread && sub.tunread.length > 0;

		await Subscriptions.setMessagesAsReadByRoomIdAndUserId(rid, uid, alert);
	}

	await NotificationQueue.clearQueueByUserId(uid);

	callbacks.runAsync('afterReadMessages', rid, { uid, lastSeen: sub.ls });
}
