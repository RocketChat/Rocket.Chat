import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { callbacks } from '../../../../../lib/callbacks';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';
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
	const isVirtualPreview = useFeaturePreview('virtualizedRoomList');
	const router = useRouter();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const [hasNewMessages, setHasNewMessages] = useState(false);

	const handleNewMessageButtonClick = useCallback(() => {
		if (!isVirtualPreview) {
			atBottomRef.current = true;
		}
		sendToBottomIfNecessary();
		setHasNewMessages(false);
		chat.composer?.focus();
	}, [atBottomRef, chat.composer, sendToBottomIfNecessary]);

	const handleJumpToRecentButtonClick = useCallback(() => {
		if (!isVirtualPreview) {
			atBottomRef.current = true;
		} else {
			const path = router.getLocationPathname().replace(/(.*)\?(.*)/gim, '$1') as LocationPathname;
			router.navigate(
				{
					pathname: path,
				},
				{
					replace: false,
				},
			);
		}
		RoomManager.getStore(rid)?.update({ lastJumpId: '' });
		sendToBottom();
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

			node.addEventListener(
				'scroll',
				withThrottling({ wait: 100 })(() => {
					atBottomRef.current && setHasNewMessages(false);
				}),
				{
					passive: true,
				},
			);
		},
		[atBottomRef],
	);

	return {
		newMessagesScrollRef: ref,
		handleNewMessageButtonClick,
		handleJumpToRecentButtonClick,
		handleComposerResize,
		hasNewMessages,
	};
};
