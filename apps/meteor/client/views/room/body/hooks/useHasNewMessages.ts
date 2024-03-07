import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { callbacks } from '../../../../../lib/callbacks';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { useChat } from '../../contexts/ChatContext';

export const useHasNewMessages = (
	rid: string,
	uid: string | undefined,
	atBottomRef: MutableRefObject<boolean>,
	{
		sendToBottom,
		sendToBottomIfNecessary,
		isAtBottom,
	}: {
		sendToBottom: () => void;
		sendToBottomIfNecessary: () => void;
		isAtBottom: (threshold?: number) => boolean;
	},
) => {
	const chat = useChat();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const [hasNewMessages, setHasNewMessages] = useState(false);

	const handleNewMessageButtonClick = useCallback(() => {
		atBottomRef.current = true;
		sendToBottomIfNecessary();
		setHasNewMessages(false);
		chat.composer?.focus();
	}, [atBottomRef, chat.composer, sendToBottomIfNecessary]);

	const handleJumpToRecentButtonClick = useCallback(() => {
		atBottomRef.current = true;
		RoomHistoryManager.clear(rid);
		RoomHistoryManager.getMoreIfIsEmpty(rid);
	}, [atBottomRef, rid]);

	const handleComposerResize = useCallback((): void => {
		sendToBottomIfNecessary();
		setHasNewMessages(false);
	}, [sendToBottomIfNecessary]);

	useEffect(() => {
		callbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (rid !== msg.rid || isEditedMessage(msg) || msg.tmid) {
					return;
				}

				if (msg.u._id === uid) {
					sendToBottom();
					setHasNewMessages(false);
					return;
				}

				if (!isAtBottom()) {
					setHasNewMessages(true);
				}
			},
			callbacks.priority.MEDIUM,
			rid,
		);

		return () => {
			callbacks.remove('streamNewMessage', rid);
		};
	}, [isAtBottom, rid, sendToBottom, uid]);

	const ref = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const messageList = node.querySelector('ul');

			if (!messageList) {
				return;
			}

			const observer = new ResizeObserver(() => {
				if (atBottomRef.current === true) {
					node.scrollTo({ left: 30, top: node.scrollHeight });
				}
			});

			observer.observe(messageList);

			node.addEventListener(
				'scroll',
				withThrottling({ wait: 100 })(() => {
					isAtBottom() && setHasNewMessages(false);
				}),
				{
					passive: true,
				},
			);
		},
		[atBottomRef, isAtBottom],
	);

	return {
		newMessagesScrollRef: ref,
		handleNewMessageButtonClick,
		handleJumpToRecentButtonClick,
		handleComposerResize,
		hasNewMessages,
	};
};
