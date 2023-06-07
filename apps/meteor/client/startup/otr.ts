import type { IMessage, AtLeast } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../app/notifications/client';
import OTR from '../../app/otr/client/OTR';
import { OtrRoomState } from '../../app/otr/lib/OtrRoomState';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { t } from '../../app/utils/lib/i18n';
import { onClientBeforeSendMessage } from '../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../lib/onClientMessageReceived';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			Notifications.onUser('otr', (type, data) => {
				if (!data.roomId || !data.userId || data.userId === Meteor.userId()) {
					return;
				}
				const instanceByRoomId = OTR.getInstanceByRoomId(data.roomId);

				if (!instanceByRoomId) {
					return;
				}

				instanceByRoomId.onUserStream(type, data);
			});
		}
	});

	onClientBeforeSendMessage.use(async (message: AtLeast<IMessage, '_id' | 'rid' | 'msg'>) => {
		const instanceByRoomId = OTR.getInstanceByRoomId(message.rid);

		if (message.rid && instanceByRoomId && instanceByRoomId.getState() === OtrRoomState.ESTABLISHED) {
			const msg = await instanceByRoomId.encrypt(message);
			return { ...message, msg, t: 'otr' };
		}
		return message;
	});

	onClientMessageReceived.use(async (message: IMessage & { notification?: boolean }) => {
		const instanceByRoomId = OTR.getInstanceByRoomId(message.rid);

		if (message.rid && instanceByRoomId && instanceByRoomId.getState() === OtrRoomState.ESTABLISHED) {
			if (message?.notification) {
				message.msg = t('Encrypted_message');
				return message;
			}
			if (message.t !== 'otr') {
				return message;
			}

			const decrypted = await instanceByRoomId.decrypt(message.msg);
			if (typeof decrypted === 'string') {
				return { ...message, msg: decrypted };
			}
			const { _id, text: msg, ack, ts, userId } = decrypted;

			if (ts) message.ts = ts;

			if (message.otrAck) {
				const otrAck = await instanceByRoomId.decrypt(message.otrAck);
				if (typeof otrAck === 'string') {
					return { ...message, msg: otrAck };
				}
				if (ack === otrAck.text) message.t = 'otr-ack';
			} else if (userId !== Meteor.userId()) {
				const encryptedAck = await instanceByRoomId.encryptText(ack);

				void sdk.call('updateOTRAck', { message, ack: encryptedAck });
			}

			return { ...message, _id, msg };
		}
		if (message.t === 'otr') message.msg = '';

		return message;
	});
});
