import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { MessageListHandle } from '@rocket.chat/ui-message-list';
import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * Takes the list to the latest messages when the viewer's own message is sent or arrives, from wherever the viewer reads, an older
 * window of the room included. A reply in a thread, shown in the room or not, and an edit are not such a message.
 */
export const useScrollToBottomOnOwnMessage = (rid: IRoom['_id'], listRef: RefObject<MessageListHandle | null>) => {
	const uid = useUserId();

	useEffect(() => {
		const id = `room-list-${rid}`;
		clientCallbacks.add(
			'streamNewMessage',
			(message: IMessage) => {
				if (message.rid !== rid || isEditedMessage(message) || message.tmid || message.u._id !== uid) {
					return;
				}
				listRef.current?.scrollToBottom();
			},
			clientCallbacks.priority.MEDIUM,
			id,
		);

		return () => clientCallbacks.remove('streamNewMessage', id);
	}, [rid, uid, listRef]);
};
