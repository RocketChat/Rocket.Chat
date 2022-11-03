import { ISubscription } from '@rocket.chat/core-typings';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { chatMessages } from '../../../app/ui/client/lib/ChatMessages';
import { callbacks } from '../../../lib/callbacks';

callbacks.add('enter-room', (sub?: ISubscription) => {
	if (!sub) {
		return;
	}

	const isAReplyInDMFromChannel = FlowRouter.getQueryParam('reply') && sub.t === 'd';
	if (isAReplyInDMFromChannel && chatMessages[sub.rid]) {
		chatMessages[sub.rid].restoreReplies();
	}
});
