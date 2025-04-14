import type { AtLeast, IMessage } from '@rocket.chat/core-typings';
import { isOTRMessage } from '@rocket.chat/core-typings';
import { useMethod, useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import OTR from '../../../../app/otr/client/OTR';
import { OtrRoomState } from '../../../../app/otr/lib/OtrRoomState';
import { t } from '../../../../app/utils/lib/i18n';
import { onClientBeforeSendMessage } from '../../../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';

export const useOTRMessaging = (uid: string) => {
	const updateOTRAck = useMethod('updateOTRAck');
	const notifyUser = useStream('notify-user');

	useEffect(() => {
		const handleNotifyUser = (type: 'handshake' | 'acknowledge' | 'deny' | 'end', data: { roomId: string; userId: string }) => {
			if (!data.roomId || !data.userId || data.userId === uid) {
				return;
			}

			const otrRoom = OTR.getInstanceByRoomId(uid, data.roomId);
			otrRoom?.onUserStream(type, data);
		};

		const handleBeforeSendMessage = async (
			message: AtLeast<IMessage, '_id' | 'rid' | 'msg'>,
		): Promise<AtLeast<IMessage, '_id' | 'rid' | 'msg'>> => {
			if (!uid) {
				return message;
			}

			const otrRoom = OTR.getInstanceByRoomId(uid, message.rid);

			if (otrRoom && otrRoom.getState() === OtrRoomState.ESTABLISHED) {
				const msg = await otrRoom.encrypt(message);
				return { ...message, msg, t: 'otr' };
			}
			return message;
		};

		const handleMessageReceived = async (message: IMessage): Promise<IMessage> => {
			if (!uid) {
				return message;
			}

			if (!isOTRMessage(message)) {
				return message;
			}

			if ('notification' in message) {
				return { ...message, msg: t('Encrypted_message') };
			}

			const otrRoom = OTR.getInstanceByRoomId(uid, message.rid);
			if (otrRoom && otrRoom.getState() === OtrRoomState.ESTABLISHED) {
				const decrypted = await otrRoom.decrypt(message.msg);
				if (typeof decrypted === 'string') {
					return { ...message, msg: decrypted };
				}

				const { _id, text: msg, ack, ts, userId } = decrypted;

				if (ts) message.ts = ts;

				if (message.otrAck) {
					const otrAck = await otrRoom.decrypt(message.otrAck);
					if (typeof otrAck === 'string') {
						return { ...message, msg: otrAck };
					}

					if (ack === otrAck.text) {
						return { ...message, _id, t: 'otr-ack', msg };
					}
				} else if (userId !== uid) {
					const encryptedAck = await otrRoom.encryptText(ack);

					void updateOTRAck({ message, ack: encryptedAck });
				}

				return { ...message, _id, msg };
			}

			if (message.t === 'otr') message.msg = '';

			return message;
		};

		const handleStopNotifyUser = notifyUser(`${uid}/otr`, handleNotifyUser);
		const unregisterBeforeSendMessage = onClientBeforeSendMessage.use(handleBeforeSendMessage);
		const unregisterMessageReceived = onClientMessageReceived.use(handleMessageReceived);

		return () => {
			handleStopNotifyUser();
			unregisterBeforeSendMessage();
			unregisterMessageReceived();
		};
	}, [uid, notifyUser, updateOTRAck]);
};
