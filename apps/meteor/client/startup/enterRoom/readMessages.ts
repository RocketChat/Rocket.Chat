import { ISubscription } from '@rocket.chat/core-typings';

import { readMessage } from '../../../app/ui-utils/client';
import { callbacks } from '../../../lib/callbacks';

callbacks.add('enter-room', (sub?: ISubscription) => {
	if (!sub) {
		return;
	}

	setTimeout(() => readMessage.read(sub.rid), 1000);
});
