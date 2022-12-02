import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Messages } from '../../../app/models/client';
import { ChatMessages } from '../../../app/ui/client';
import { callbacks } from '../../../lib/callbacks';
import { callWithErrorHandling } from '../../lib/utils/callWithErrorHandling';

callbacks.add('enter-room', async (sub?: ISubscription) => {
	if (!sub) {
		return;
	}

	const mid = FlowRouter.getQueryParam('reply');
	if (!mid) {
		return;
	}

	const getSingleMessage = (mid: IMessage['_id']): Promise<IMessage> => callWithErrorHandling('getSingleMessage', mid);

	const message = (Messages as Mongo.Collection<IMessage>).findOne(mid) ?? (await getSingleMessage(mid));
	if (!message) {
		return;
	}

	ChatMessages.get({ rid: sub.rid })?.quotedMessages.add(message);
});
