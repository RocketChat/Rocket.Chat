import { NotificationQueue, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../lib/callbacks';

export async function readMessages(rid: string, uid: string): Promise<void> {
	callbacks.run('beforeReadMessages', rid, uid);

	const projection = { ls: 1, tunread: 1, alert: 1 };
	const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid, { projection });
	if (!sub) {
		throw new Error('error-invalid-subscription');
	}

	// do not mark room as read if there are still unread threads
	const alert = sub.alert && sub.tunread && sub.tunread.length > 0;

	await Subscriptions.setMessagesAsReadByRoomIdAndUserId(rid, uid, alert);

	await NotificationQueue.clearQueueByUserId(uid);

	callbacks.runAsync('afterReadMessages', rid, { uid, lastSeen: sub.ls });
}
