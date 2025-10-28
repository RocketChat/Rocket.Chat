import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { callbacks } from '../../../../../../lib/callbacks';
import { useListIsAtBottom } from '../../../body/hooks/useListIsAtBottom';
import { useRoom } from '../../../contexts/RoomContext';

export const useLegacyThreadMessageListScrolling = (mainMessage: IMessage) => {
	const { atBottomRef, innerRef, sendToBottom, sendToBottomIfNecessary, isAtBottom, jumpToRef } = useListIsAtBottom();
	const room = useRoom();
	const uid = useUserId();
	useEffect(() => {
		callbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (room._id !== msg.rid || isEditedMessage(msg) || msg.tmid !== mainMessage._id) {
					return;
				}

				if (msg.u._id === uid) {
					atBottomRef.current = true;
					sendToBottomIfNecessary();
				}
			},
			callbacks.priority.MEDIUM,
			`thread-scroll-${room._id}`,
		);

		return () => {
			callbacks.remove('streamNewMessage', `thread-scroll-${room._id}`);
		};
	}, [room._id, atBottomRef, sendToBottomIfNecessary, uid, mainMessage._id]);

	return { atBottomRef, innerRef, sendToBottom, sendToBottomIfNecessary, isAtBottom, jumpToRef };
};
