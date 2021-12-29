import { Tracker } from 'meteor/tracker';

import { e2ee } from '../../../app/e2e/client/e2ee';
import { onClientBeforeSendMessage } from '../onClientBeforeSendMessage';
import { onClientMessageReceived } from '../onClientMessageReceived';

export const attachE2EEManagement = (): (() => void) | undefined => {
	let detachKeyRequestHandler: (() => void) | undefined;
	let detachSubscriptionWatcher: (() => void) | undefined;
	let detachMessageReceivedTransform: (() => void) | undefined;
	let detachSendingMessageTransform: (() => void) | undefined;

	const attacher = Tracker.autorun(() => {
		if (e2ee.isReady()) {
			detachKeyRequestHandler = e2ee.watchKeyRequests();
			detachSubscriptionWatcher = e2ee.watchSubscriptions();
			detachMessageReceivedTransform = onClientMessageReceived.use((msg) => e2ee.transformReceivedMessage(msg));
			detachSendingMessageTransform = onClientBeforeSendMessage.use((msg) => e2ee.transformSendingMessage(msg));
			return;
		}

		detachKeyRequestHandler?.();
		detachSubscriptionWatcher?.();
		detachMessageReceivedTransform?.();
		detachSendingMessageTransform?.();
	});

	return (): void => {
		attacher.stop();
	};
};
