import { Subscriptions } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../lib/callbacks';

export async function markThreadAsRead(message: IMessage, rid: string, uid: string): Promise<void> {
    const projection = { ls: 1, tunread: 1, alert: 1 };
	const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid, { projection });
	if (!sub) {
		throw new Error('error-invalid-subscription');
	}

	callbacks.runAsync('afterReadThread', message, { rid, uid });
}
