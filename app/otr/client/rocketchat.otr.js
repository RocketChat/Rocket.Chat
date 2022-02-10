import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { Subscriptions } from '../../models';
import { Notifications } from '../../notifications';
import { t } from '../../utils';
import { onClientMessageReceived } from '../../../client/lib/onClientMessageReceived';
import { onClientBeforeSendMessage } from '../../../client/lib/onClientBeforeSendMessage';

class OTRClass {
	constructor() {
		this.enabled = new ReactiveVar(false);
		this.instancesByRoomId = {};
		this.crypto = null;
	}

	isEnabled() {
		return this.enabled.get();
	}

	getInstanceByRoomId(roomId) {
		if (!this.enabled.get()) {
			return;
		}

		if (this.instancesByRoomId[roomId]) {
			return this.instancesByRoomId[roomId];
		}

		const subscription = Subscriptions.findOne({
			rid: roomId,
		});

		if (!subscription || subscription.t !== 'd') {
			return;
		}

		this.instancesByRoomId[roomId] = new OTR.Room(Meteor.userId(), roomId); // eslint-disable-line no-use-before-define
		return this.instancesByRoomId[roomId];
	}
}

export const OTR = new OTRClass();

Meteor.startup(function () {
	Tracker.autorun(function () {
		if (Meteor.userId()) {
			Notifications.onUser('otr', (type, data) => {
				if (!data.roomId || !data.userId || data.userId === Meteor.userId()) {
					return;
				}
				OTR.getInstanceByRoomId(data.roomId).onUserStream(type, data);
			});
		}
	});

	onClientBeforeSendMessage.use(async (message) => {
		try {
			if (message.rid && OTR.getInstanceByRoomId(message.rid) && OTR.getInstanceByRoomId(message.rid).established.get()) {
				const msg = await OTR.getInstanceByRoomId(message.rid).encrypt(message);
				return { ...message, msg, t: 'otr' };
			}
			return message;
		} catch (error) {
			console.error(error);
		}
	});

	onClientMessageReceived.use(async (message) => {
		try {
			if (message.rid && OTR.getInstanceByRoomId(message.rid) && OTR.getInstanceByRoomId(message.rid).established.get()) {
				if (message.notification) {
					message.msg = t('Encrypted_message');
					return message;
				}
				const otrRoom = OTR.getInstanceByRoomId(message.rid);
				const { _id, text: msg, ack, ts, userId } = await otrRoom.decrypt(message.msg);

				if (ts) message.ts = ts;

				if (message.otrAck) {
					const { text: otrAckText } = await otrRoom.decrypt(message.otrAck);
					if (ack === otrAckText) message.t = 'otr-ack';
				} else if (userId !== Meteor.userId()) {
					const encryptedAck = await otrRoom.encryptText(ack);

					Meteor.call('updateOTRAck', { message, ack: encryptedAck });
				}

				return { ...message, _id, msg };
			}
			if (message.t === 'otr') message.msg = '';

			return message;
		} catch (error) {
			console.error(error);
		}
	});
});
