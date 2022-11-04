import { ISubscription } from '@rocket.chat/core-typings';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatMessages } from '../../../app/ui/client';
import { callbacks } from '../../../lib/callbacks';

callbacks.add('enter-room', (sub?: ISubscription) => {
	if (!sub) {
		return;
	}

	const isAReplyInDMFromChannel = FlowRouter.getQueryParam('reply') && sub.t === 'd';
	if (isAReplyInDMFromChannel) {
		ChatMessages.get({ rid: sub.rid })?.restoreReplies();
	}
});
