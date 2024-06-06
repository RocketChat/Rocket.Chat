import type { AtLeast, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { E2EEState } from '../../app/e2e/client/E2EEState';
import { e2e } from '../../app/e2e/client/rocketchat.e2e';
import { Subscriptions, ChatRoom } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { onClientBeforeSendMessage } from '../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../lib/onClientMessageReceived';
import { isLayoutEmbedded } from '../lib/utils/isLayoutEmbedded';
import { waitUntilFind } from '../lib/utils/waitUntilFind';
import { router } from '../providers/RouterProvider';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			e2e.log('Not logged in');
			return;
		}

		if (!window.crypto) {
			e2e.error('No crypto support');
			return;
		}

		const enabled = settings.get('E2E_Enable');
		// we don't care about the reactivity of this boolean
		const adminEmbedded = isLayoutEmbedded() && router.getLocationPathname().startsWith('/admin');

		if (enabled && !adminEmbedded) {
			e2e.log('E2E enabled starting client');
			e2e.startClient();
		} else {
			e2e.log('E2E disabled');
			e2e.setState(E2EEState.DISABLED);
			e2e.closeAlert();
		}
	});

	let observable: Meteor.LiveQueryHandle | null = null;
	let offClientMessageReceived: undefined | (() => void);
	let offClientBeforeSendMessage: undefined | (() => void);
	let listenersAttached = false;

	Tracker.autorun(() => {
		if (!e2e.isReady()) {
			e2e.log('Not ready');
			offClientMessageReceived?.();
			e2e.log('STOPING Observable')
			observable?.stop();
			offClientBeforeSendMessage?.();
			listenersAttached = false;
			return;
		}

		if (listenersAttached) {
			e2e.log('Listeners already attached');
			return;
		}

		offClientMessageReceived = onClientMessageReceived.use(async (msg: IMessage) => {
			const e2eRoom = await e2e.getInstanceByRoomId(msg.rid);
			if (!e2eRoom?.shouldConvertReceivedMessages()) {
				return msg;
			}
			return e2e.decryptMessage(msg);
		});

		// Encrypt messages before sending
		offClientBeforeSendMessage = onClientBeforeSendMessage.use(async (message: AtLeast<IMessage, '_id' | 'rid' | 'msg'>) => {
			const e2eRoom = await e2e.getInstanceByRoomId(message.rid);

			if (!e2eRoom) {
				return message;
			}

			const subscription = await waitUntilFind(() => ChatRoom.findOne({ _id: message.rid }));

			subscription.encrypted ? e2eRoom.resume() : e2eRoom.pause();

			const shouldConvertSentMessages = await e2eRoom.shouldConvertSentMessages(message);

			if (!shouldConvertSentMessages) {
				return message;
			}

			// Should encrypt this message.
			const msg = await e2eRoom.encrypt(message);
			message.msg = msg;
			message.t = 'e2e';
			message.e2e = 'pending';
			return message;
		});

		listenersAttached = true;
		e2e.log('Listeners attached', listenersAttached);
	});
});
