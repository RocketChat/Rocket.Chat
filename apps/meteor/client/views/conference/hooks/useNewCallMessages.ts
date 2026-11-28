import type { IMessage, ISubscription, IUser } from '@rocket.chat/core-typings';
import { isE2EEMessage, isEditedMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ConferenceNewMessage, ConferenceRoom } from '@rocket.chat/ui-conference';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { e2e } from '../../../lib/e2ee/rocketchat.e2e';
import { normalizeMessagePreview } from '../../../lib/utils/normalizeMessagePreview/normalizeMessagePreview';

type NewCallMessageScope = {
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
export const isIncomingCallMessage = (message: IMessage, { uid, tmid, since, ignored }: NewCallMessageScope): boolean =>
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

type NewCallMessageEvents = {
	message: ConferenceNewMessage;
};

/**
 * Listens for the messages other people send to the call's chat after `joinedAt`, each handed over once and in
 * the order they arrived. Nothing is heard until there is a room, a reader and a `joinedAt`.
 */
export const useNewCallMessages = ({
	rid,
	tmid,
	joinedAt,
	ignored,
}: {
	rid?: IMessage['rid'];
	tmid?: IMessage['_id'];
	joinedAt?: Date;
	ignored?: ISubscription['ignored'];
}): ConferenceRoom['onNewMessage'] => {
	const uid = useUserId();
	const subscribeToRoomMessages = useStream('room-messages');
	const { t } = useTranslation();
	const [emitter] = useState(() => new Emitter<NewCallMessageEvents>());
	const joinedAtTime = joinedAt?.getTime();

	const isNew = useStableCallback(
		(message: IMessage, since: Date): boolean => !!uid && isIncomingCallMessage(message, { uid, tmid, since, ignored }),
	);

	const toNewMessage = useStableCallback(async (message: IMessage): Promise<ConferenceNewMessage | undefined> => {
		const read = await readable(message);
		const text = isUnreadable(read) ? undefined : normalizeMessagePreview(read, t);

		if (!text && !isUnreadable(read)) {
			return undefined;
		}

		return { _id: message._id, username: message.u.username, name: message.u.name, text };
	});

	useEffect(() => {
		if (!rid || !uid || joinedAtTime === undefined) {
			return;
		}

		const since = new Date(joinedAtTime);
		const seen = new Set<IMessage['_id']>();
		let queue = Promise.resolve();
		let stopped = false;

		const stop = subscribeToRoomMessages(rid, (message) => {
			if (seen.has(message._id) || !isNew(message, since)) {
				return;
			}

			seen.add(message._id);

			if (!emitter.has('message')) {
				return;
			}

			queue = queue
				.then(() => toNewMessage(message))
				.then((newMessage) => {
					if (newMessage && !stopped) {
						emitter.emit('message', newMessage);
					}
				})
				// One message failing to preview must not hold back the ones queued after it.
				.catch(() => undefined);
		});

		return () => {
			stopped = true;
			stop();
		};
	}, [rid, uid, joinedAtTime, subscribeToRoomMessages, emitter, isNew, toNewMessage]);

	return useCallback((listener) => emitter.on('message', listener), [emitter]);
};
