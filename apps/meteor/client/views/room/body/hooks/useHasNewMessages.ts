import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { clientCallbacks } from '@rocket.chat/ui-client';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { useChat } from '../../contexts/ChatContext';

export const useHasNewMessages = (
	rid: string,
	uid: string | undefined,
	setShouldJumpToBottom: Dispatch<SetStateAction<boolean>>,
	isAtBottom: MutableRefObject<boolean>,
) => {
	const chat = useChat();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const [hasNewMessages, setHasNewMessages] = useState(false);

	const handleNewMessageButtonClick = useCallback(() => {
		setShouldJumpToBottom(true);
		setHasNewMessages(false);
		chat.composer?.focus();
	}, [setShouldJumpToBottom, chat.composer]);

	const handleJumpToRecentButtonClick = useCallback(() => {
		setShouldJumpToBottom(true);
		RoomHistoryManager.clear(rid);
		RoomHistoryManager.getMoreIfIsEmpty(rid);
	}, [setShouldJumpToBottom, rid]);

	const handleComposerResize = useCallback((): void => {
		setShouldJumpToBottom(true);
		setHasNewMessages(false);
	}, [setShouldJumpToBottom]);

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
					setShouldJumpToBottom(true);
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
	}, [isAtBottom, rid, setShouldJumpToBottom, uid]);

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
