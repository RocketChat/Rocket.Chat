import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Layout } from '../../app/ui-utils/client';
import { settings } from '../../app/settings/client';
import { promises } from '../../app/promises/client';
import { Notifications } from '../../app/notifications/client';
import { e2e } from '../../app/e2e/client/rocketchat.e2e';
import { Subscriptions } from '../../app/models';

const handle = async (roomId, keyId) => {
	const e2eRoom = await e2e.getInstanceByRoomId(roomId);
	if (!e2eRoom) {
		return;
	}

	e2eRoom.provideKeyToUser(keyId);
};

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			const adminEmbedded = Layout.isEmbedded() && FlowRouter.current().path.startsWith('/admin');

			if (!adminEmbedded && settings.get('E2E_Enable') && window.crypto) {
				e2e.startClient();
				e2e.enabled.set(true);
			} else {
				e2e.enabled.set(false);
				e2e.closeAlert();
			}
		}
	});

	let observable = null;
	Tracker.autorun(() => {
		if (!e2e.isReady()) {
			promises.remove('onClientMessageReceived', 'e2e-decript-message');
			Notifications.unUser('e2ekeyRequest', handle);
			observable?.stop();
			return promises.remove('onClientBeforeSendMessage', 'e2e');
		}


		Notifications.onUser('e2ekeyRequest', handle);


		observable = Subscriptions.find().observe({
			changed: async (doc) => {
				if (!doc.encrypted && !doc.E2EKey) {
					return e2e.removeInstanceByRoomId(doc.rid);
				}
				const e2eRoom = await e2e.getInstanceByRoomId(doc.rid);

				if (!e2eRoom) {
					return;
				}


				doc.encrypted ? e2eRoom.unPause() : e2eRoom.pause();

				// Cover private groups and direct messages
				if (!e2eRoom.isSupportedRoomType(doc.t)) {
					return e2eRoom.disable();
				}


				if (doc.E2EKey && e2eRoom.isWaitingKeys()) {
					return e2eRoom.keyReceived();
				}
				if (!e2eRoom.isReady()) {
					return;
				}
				e2eRoom.decryptSubscription();
			},
			added: async (doc) => {
				if (!doc.encrypted && !doc.E2EKey) {
					return;
				}
				return e2e.getInstanceByRoomId(doc.rid);
			},
			removed: (doc) => {
				e2e.removeInstanceByRoomId(doc.rid);
			},
		});

		promises.add('onClientMessageReceived', async (msg) => {
			const e2eRoom = await e2e.getInstanceByRoomId(msg.rid);
			if (!e2eRoom || !e2eRoom.shouldConvertReceivedMessages()) {
				return msg;
			}
			return e2e.decryptMessage(msg);
		}, promises.priority.HIGH, 'e2e-decript-message');

		// Encrypt messages before sending
		promises.add('onClientBeforeSendMessage', async function(message) {
			const e2eRoom = await e2e.getInstanceByRoomId(message.rid);
			if (!e2eRoom || !e2eRoom.shouldConvertSentMessages()) {
				return message;
			}

			// Should encrypt this message.
			const msg = await e2eRoom.encrypt(message);

			message.msg = msg;
			message.t = 'e2e';
			message.e2e = 'pending';
			return message;
		}, promises.priority.HIGH, 'e2e');
	});
});
