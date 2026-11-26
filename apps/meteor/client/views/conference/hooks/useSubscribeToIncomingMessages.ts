import type { IMessage, ISubscription, IUser } from '@rocket.chat/core-typings';
import { isE2EEMessage, isEditedMessage } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ConferenceNewMessage } from '@rocket.chat/ui-conference';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { e2e } from '../../../lib/e2ee/rocketchat.e2e';
import { normalizeMessagePreview } from '../../../lib/utils/normalizeMessagePreview/normalizeMessagePreview';

type IncomingMessageScope = {
	uid: IUser['_id'];
	tmid?: IMessage['_id'];
	since: Date;
	ignored?: ISubscription['ignored'];
};

/**
 * Whether a message from the room's stream is someone talking to the call's chat. The stream sends a message
 * again, whole, on every change to it (a reaction, an edit, a reply in its thread), so when it was sent and
 * whether it was edited are what tell a new message from an old one that changed.
 */
export const isIncomingCallMessage = (message: IMessage, { uid, tmid, since, ignored }: IncomingMessageScope): boolean =>
	message.u._id !== uid &&
	!ignored?.includes(message.u._id) &&
	(!message.t || isE2EEMessage(message)) &&
	!isEditedMessage(message) &&
	message.ts > since &&
	(tmid ? message.tmid === tmid : !message.tmid || message.tshow === true);

/** The message as it reads once decrypted, or as it arrived when this session cannot decrypt it. */
const readable = async (message: IMessage): Promise<IMessage> => {
	if (!isE2EEMessage(message)) {
		return message;
	}

	try {
		return await e2e.decryptMessage(message);
	} catch {
		return message;
	}
};

const isUnreadable = (message: IMessage): boolean => isE2EEMessage(message) && message.e2e !== 'done';

/**
 * How to listen for the messages other people send to the call's chat from `since` on, each handed over once.
 * Undefined until there is a room, a reader and a `since` to count from.
 */
export const useSubscribeToIncomingMessages = ({
	rid,
	tmid,
	since,
	ignored,
}: {
	rid?: IMessage['rid'];
	tmid?: IMessage['_id'];
	since?: Date;
	ignored?: ISubscription['ignored'];
}): ((listener: (message: ConferenceNewMessage) => void) => () => void) | undefined => {
	const uid = useUserId();
	const subscribeToRoomMessages = useStream('room-messages');
	const { t } = useTranslation();
	const sinceTime = since?.getTime();

	const isIncoming = useStableCallback(
		(message: IMessage, since: Date): boolean => !!uid && isIncomingCallMessage(message, { uid, tmid, since, ignored }),
	);

	const toIncomingMessage = useStableCallback(async (message: IMessage): Promise<ConferenceNewMessage | undefined> => {
		const read = await readable(message);
		const text = isUnreadable(read) ? undefined : normalizeMessagePreview(read, t);

		// Nothing to show for a message that is only blocks or an empty attachment; one that could not be read still says so.
		if (!text && !isUnreadable(read)) {
			return undefined;
		}

		return { _id: message._id, username: message.u.username, name: message.u.name, text };
	});

	return useMemo(() => {
		if (!rid || !uid || sinceTime === undefined) {
			return undefined;
		}

		const since = new Date(sinceTime);

		return (listener) => {
			const previewed = new Set<IMessage['_id']>();
			let stopped = false;

			const stop = subscribeToRoomMessages(rid, (message) => {
				if (previewed.has(message._id) || !isIncoming(message, since)) {
					return;
				}

				previewed.add(message._id);

				void toIncomingMessage(message).then((incoming) => {
					if (incoming && !stopped) {
						listener(incoming);
					}
				});
			});

			return () => {
				stopped = true;
				stop();
			};
		};
	}, [rid, uid, sinceTime, subscribeToRoomMessages, isIncoming, toIncomingMessage]);
};
