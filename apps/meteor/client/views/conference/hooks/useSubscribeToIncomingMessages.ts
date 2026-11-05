import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { isE2EEMessage, isEditedMessage } from '@rocket.chat/core-typings';
import type { ConferenceRoom } from '@rocket.chat/ui-conference';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getMessagePreviewText } from '../../../lib/utils/normalizeMessagePreview/normalizeMessagePreview';

type IncomingMessageScope = {
	uid: IUser['_id'];
	tmid?: IMessage['_id'];
	since: Date;
};

export const isIncomingCallMessage = (message: IMessage, { uid, tmid, since }: IncomingMessageScope): boolean =>
	message.u._id !== uid &&
	(!message.t || isE2EEMessage(message)) &&
	!isEditedMessage(message) &&
	message.ts > since &&
	(tmid ? message.tmid === tmid : !message.tmid || message.tshow === true);

export const useSubscribeToIncomingMessages = ({
	rid,
	tmid,
	since,
}: {
	rid?: IMessage['rid'];
	tmid?: IMessage['_id'];
	since?: Date;
}): ConferenceRoom['subscribeToIncomingMessages'] => {
	const uid = useUserId();
	const subscribeToRoomMessages = useStream('room-messages');
	const { t } = useTranslation();
	const sinceTime = since?.getTime();

	return useMemo(() => {
		if (!rid || !uid || sinceTime === undefined) {
			return undefined;
		}

		const scope = { uid, tmid, since: new Date(sinceTime) };

		return (listener) => {
			const previewed = new Set<IMessage['_id']>();

			return subscribeToRoomMessages(rid, (message) => {
				if (previewed.has(message._id) || !isIncomingCallMessage(message, scope)) {
					return;
				}

				previewed.add(message._id);
				listener({
					_id: message._id,
					username: message.u.username,
					name: message.u.name,
					preview: isE2EEMessage(message) ? t('Encrypted_message_preview_unavailable') : getMessagePreviewText(message, t),
				});
			});
		};
	}, [rid, tmid, uid, sinceTime, subscribeToRoomMessages, t]);
};
