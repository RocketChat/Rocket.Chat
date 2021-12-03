import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { attachKeyRequestHandler } from '../../app/e2e/client/attachKeyRequestHandler';
import { attachSubscriptionWatcher } from '../../app/e2e/client/attachSubscriptionWatcher';
import { handleAfterReceiveMessage } from '../../app/e2e/client/handleAfterReceiveMessage';
import { handleBeforeSendMessage } from '../../app/e2e/client/handleBeforeSendMessage';
import { e2e } from '../../app/e2e/client/rocketchat.e2e';
import { onClientBeforeSendMessage } from '../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../lib/onClientMessageReceived';

Meteor.startup(() => {
	let detachKeyRequestHandler: (() => void) | undefined;
	let detachSubscriptionWatcher: (() => void) | undefined;
	let detachMessageReceivedTransform: undefined | (() => void);
	let detachSendingMessageTransform: undefined | (() => void);

	Tracker.autorun(() => {
		if (!e2e.isReady()) {
			detachKeyRequestHandler?.();
			detachSubscriptionWatcher?.();
			detachMessageReceivedTransform?.();
			detachSendingMessageTransform?.();
			return;
		}

		detachKeyRequestHandler = attachKeyRequestHandler();
		detachSubscriptionWatcher = attachSubscriptionWatcher();
		detachMessageReceivedTransform = onClientMessageReceived.use(handleAfterReceiveMessage);
		detachSendingMessageTransform = onClientBeforeSendMessage.use(handleBeforeSendMessage);
	});
});

Accounts.onLogout(() => {
	e2e.stopClient();
});
