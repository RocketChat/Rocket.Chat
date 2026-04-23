import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { clientCallbacks } from '@rocket.chat/ui-client';
import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { useChat } from '../../contexts/ChatContext';

export const useHasNewMessages = (
	rid: string,
	uid: string | undefined,
	shouldJumpToBottom: MutableRefObject<boolean>,
	isAtBottom: MutableRefObject<boolean>,
) => {
	const chat = useChat();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const [hasNewMessages, setHasNewMessages] = useState(false);

	const handleNewMessageButtonClick = useCallback(() => {
		shouldJumpToBottom.current = true;
		setHasNewMessages(false);
		chat.composer?.focus();
	}, [shouldJumpToBottom, chat.composer]);

	const handleJumpToRecentButtonClick = useCallback(() => {
		shouldJumpToBottom.current = true;
		RoomHistoryManager.clear(rid);
		RoomHistoryManager.getMoreIfIsEmpty(rid);
	}, [shouldJumpToBottom, rid]);

	const handleComposerResize = useCallback((): void => {
		shouldJumpToBottom.current = true;
		setHasNewMessages(false);
	}, [shouldJumpToBottom]);

	useEffect(() => {
		clientCallbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (rid !== msg.rid || isEditedMessage(msg) || msg.tmid) {
					return;
				}

				if (msg.u._id === uid) {
					return;
				}

				if (!isAtBottom.current) {
					setHasNewMessages(true);
				}
			},
			clientCallbacks.priority.MEDIUM,
			rid,
		);

		clientCallbacks.add(
			'afterSaveMessage',
			(msg: IMessage) => {
				if (msg.tmid) {
					return;
				}
				if (msg.u._id === uid) {
					shouldJumpToBottom.current = true;
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
	}, [isAtBottom, rid, shouldJumpToBottom, uid]);

	const debouncedClearNewMessagesOnScroll = useDebouncedCallback(
		() => {
			if (isAtBottom.current) {
				setHasNewMessages(false);
			}
		},
		100,
		[],
	);

	return {
		debouncedClearNewMessagesOnScroll,
		handleNewMessageButtonClick,
		handleJumpToRecentButtonClick,
		handleComposerResize,
		hasNewMessages,
	};
};
