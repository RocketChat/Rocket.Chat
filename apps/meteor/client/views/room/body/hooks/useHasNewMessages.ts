import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { useCallback, useEffect, useState } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { useMessageListVirtualizer } from '../../../../components/message/list/MessageListContext';
import { useChat } from '../../contexts/ChatContext';

export const useHasNewMessages = (rid: string, uid: string | undefined) => {
	const chat = useChat();
	const virtualizerRef = useMessageListVirtualizer();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const [hasNewMessages, setHasNewMessages] = useState(false);

	const handleNewMessageButtonClick = useCallback(() => {
		virtualizerRef?.current?.requestScrollToEnd();
		setHasNewMessages(false);
		chat.composer?.focus();
	}, [chat.composer, virtualizerRef]);

	const handleJumpToRecentButtonClick = useCallback(() => {
		RoomHistoryManager.clear(rid);
		RoomHistoryManager.getMoreIfIsEmpty(rid);
	}, [rid]);

	const handleComposerResize = useCallback((): void => {
		if (virtualizerRef?.current?.isAtBottom()) {
			virtualizerRef.current.requestScrollToEnd();
		}
		setHasNewMessages(false);
	}, [virtualizerRef]);

	useEffect(() => {
		clientCallbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (rid !== msg.rid || isEditedMessage(msg) || msg.tmid) {
					return;
				}

				if (!virtualizerRef?.current?.isAtBottom()) {
					setHasNewMessages(true);
				}
			},
			clientCallbacks.priority.MEDIUM,
			rid,
		);

		clientCallbacks.add(
			'afterSaveMessage',
			(msg: IMessage) => {
				if (msg.u._id === uid) {
					virtualizerRef?.current?.requestScrollToEnd();
					setHasNewMessages(false);
				}
			},
			clientCallbacks.priority.MEDIUM,
			rid,
		);

		return () => {
			clientCallbacks.remove('streamNewMessage', rid);
			clientCallbacks.remove('afterSaveMessage', rid);
		};
	}, [rid, uid, virtualizerRef]);

	return {
		handleNewMessageButtonClick,
		handleJumpToRecentButtonClick,
		handleComposerResize,
		hasNewMessages,
	};
};
