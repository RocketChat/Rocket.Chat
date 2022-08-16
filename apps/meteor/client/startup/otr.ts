import { IMessage, IOTRMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../app/notifications/client';
import { onClientBeforeSendMessage } from '../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../lib/onClientMessageReceived';
import OTR from '../../app/otr/client/OTR';
import { OtrRoomState } from '../../app/otr/lib/OtrRoomState';
import { t } from '../../app/utils/client';

type NotifyUserData = {
	roomId: IRoom['_id'];
	userId: IUser['_id'];
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			Notifications.onUser('otr', (type: string, data: NotifyUserData) => {
				if (!data.roomId || !data.userId || data.userId === Meteor.userId()) {
					return;
				}
				const OTRInstace = OTR.getInstanceByRoomId(data.roomId);

				if (!OTRInstace) {
					return;
				}

				OTRInstace.onUserStream(type, data);
			});
		}
	});

	onClientBeforeSendMessage.use(async (message: IMessage) => {
		const OTRInstace = OTR.getInstanceByRoomId(message.rid);

		if (message.rid && OTRInstace && OTRInstace.getState() === OtrRoomState.ESTABLISHED) {
			const msg = await OTRInstace.encrypt(message);
			return { ...message, msg, t: 'otr' };
		}
		return message;
	});

	onClientMessageReceived.use(async (message: IOTRMessage & { notification?: boolean }) => {
		const OTRInstace = OTR.getInstanceByRoomId(message.rid);

		if (message.rid && OTRInstace && OTRInstace.getState() === OtrRoomState.ESTABLISHED) {
			if (message?.notification) {
				message.msg = t('Encrypted_message');
				return message;
			}
			if (message.t !== 'otr') {
				return message;
			}
			const otrRoom = OTRInstace;
			const { _id, text: msg, ack, ts, userId } = await otrRoom.decrypt(message.msg);

			if (ts) message.ts = ts;

			if (message?.otr?.ack) {
				const { text: otrAckText } = await otrRoom.decrypt(message.otr.ack);
				if (ack === otrAckText) message.t = 'otr-ack';
			} else if (userId !== Meteor.userId()) {
				const encryptedAck = await otrRoom.encryptText(ack);

				Meteor.call('updateOTRAck', { message, ack: encryptedAck });
			}

			return { ...message, _id, msg };
		}
		if (message.t === 'otr') message.msg = '';

		return message;
	});
});
