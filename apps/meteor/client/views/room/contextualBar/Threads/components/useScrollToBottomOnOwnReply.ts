import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { MessageListHandle } from '@rocket.chat/ui-message-list';
import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * Takes the thread's list to its latest replies when the viewer's own reply to the thread arrives, from wherever the viewer reads, an
 * older window of the thread included. An edit and the replies of anyone else are not such a reply.
 */
export const useScrollToBottomOnOwnReply = (rid: IRoom['_id'], tmid: IMessage['_id'], listRef: RefObject<MessageListHandle | null>) => {
	const uid = useUserId();

	useEffect(() => {
		const id = `thread-list-${tmid}`;
		clientCallbacks.add(
			'streamNewMessage',
			(message: IMessage) => {
				if (message.rid !== rid || isEditedMessage(message) || message.tmid !== tmid || message.u._id !== uid) {
					return;
				}
				listRef.current?.scrollToBottom();
			},
			clientCallbacks.priority.MEDIUM,
			id,
		);

		return () => clientCallbacks.remove('streamNewMessage', id);
	}, [rid, tmid, uid, listRef]);
};
