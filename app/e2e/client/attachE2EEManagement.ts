import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { onClientBeforeSendMessage } from '../../../client/lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../../../client/lib/onClientMessageReceived';
import { isLayoutEmbedded } from '../../../client/lib/utils/isLayoutEmbedded';
import { settings } from '../../settings/client';
import { e2ee } from './e2ee';

const isEnabled = (): boolean => {
	if (!Meteor.userId()) {
		return false;
	}

	const adminEmbedded = isLayoutEmbedded() && FlowRouter.current().path.startsWith('/admin');

	if (adminEmbedded) {
		return false;
	}

	return settings.get('E2E_Enable');
};

export const attachE2EEManagement = (): (() => void) | undefined => {
	if (!window.crypto) {
		return undefined;
	}

	const flagWatcher = Tracker.autorun(() => {
		e2ee.toggle(isEnabled());
	});

	let detachKeyRequestHandler: (() => void) | undefined;
	let detachSubscriptionWatcher: (() => void) | undefined;
	let detachMessageReceivedTransform: (() => void) | undefined;
	let detachSendingMessageTransform: (() => void) | undefined;
	let detachLogoutHandler: (() => void) | undefined;

	const attachLogoutHandler = (): (() => void) => {
		const computation = Accounts.onLogout(() => {
			e2ee.stopClient();
		}) as unknown as {
			stop(): void;
			callback: () => void;
		}; // return type is wrong at declaration files

		return (): void => {
			computation.stop();
		};
	};

	const attacher = Tracker.autorun(() => {
		if (!e2ee.isReady()) {
			detachKeyRequestHandler?.();
			detachSubscriptionWatcher?.();
			detachMessageReceivedTransform?.();
			detachSendingMessageTransform?.();
      detachLogoutHandler?.();
      return;
		}

		detachKeyRequestHandler = e2ee.watchKeyRequests();
		detachSubscriptionWatcher = e2ee.watchSubscriptions();
		detachMessageReceivedTransform = onClientMessageReceived.use((msg) => e2ee.transformReceivedMessage(msg));
		detachSendingMessageTransform = onClientBeforeSendMessage.use((msg) =>
			e2ee.transformSendingMessage(msg),
		);
		detachLogoutHandler = attachLogoutHandler();
	});

	return (): void => {
		attacher.stop();
		flagWatcher.stop();
		e2ee.toggle(false);
	};
};
