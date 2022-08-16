import { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../app/notifications/client';
import OTR from '../../app/otr/client/OTR';
import { IOnUserStreamData, IOTRDecrypt } from '../../app/otr/lib/IOTR';
import { OtrRoomState } from '../../app/otr/lib/OtrRoomState';
import { t } from '../../app/utils/client';
import { onClientBeforeSendMessage } from '../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../lib/onClientMessageReceived';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			Notifications.onUser('otr', (type: string, data: IOnUserStreamData) => {
				const instanceByRoomId = OTR.getInstanceByRoomId(data.roomId);
				if (!data.roomId || !data.userId || data.userId === Meteor.userId() || !instanceByRoomId) {
					return;
				}
				instanceByRoomId.onUserStream(type, data);
			});
		}
	});

	onClientBeforeSendMessage.use(async (message: IMessage) => {
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
			if (message.notification) {
				message.msg = t('Encrypted_message');
				return message;
			}
			if (message?.t !== 'otr') {
				return message;
			}
			const otrRoom = instanceByRoomId;
			const decrypted = await otrRoom.decrypt(message.msg);
			if (typeof decrypted === 'string') {
				return { ...message, msg: decrypted };
			}
			const { _id, text: msg, ack, ts, userId }: IOTRDecrypt = decrypted;

			if (ts) message.ts = ts;

			if (message.otrAck) {
				const otrAck = await otrRoom.decrypt(message.otrAck);
				if (typeof otrAck === 'string') {
					return { ...message, msg: otrAck };
				}

				if (ack === otrAck.text) message.t = 'otr-ack';
			} else if (userId !== Meteor.userId()) {
				const encryptedAck = await otrRoom.encryptText(ack);

				Meteor.call('updateOTRAck', _id, encryptedAck);
			}

			return { ...message, _id, msg };
		}
		if (message.t === 'otr') message.msg = '';

		return message;
	});
});
