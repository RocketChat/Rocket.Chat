import type { IRoom, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

import { MessageListItem } from './MessageListItem';
import { isMessageSequential } from './lib/isMessageSequential';
import { RoomManager } from '../../../lib/RoomManager';

const ESTIMATE_SIZE = 84;
const OVERSCAN = 5;
const DEFAULT_MAX_RENDERED = 50;

type VirtualizedMessageListProps = {
	rid: IRoom['_id'];
	messages: IMessage[];
	scrollContainerRef?: MutableRefObject<HTMLElement | null>;
	messageGroupingPeriod: number;
	firstUnreadMessageId: string | undefined;
	showUserAvatar: boolean;
	subscription: ISubscription | undefined;
	maxRenderedMessages?: number;
};

export function VirtualizedMessageList({
	rid,
	messages,
	scrollContainerRef,
	messageGroupingPeriod,
	firstUnreadMessageId,
	showUserAvatar,
	subscription,
	maxRenderedMessages = DEFAULT_MAX_RENDERED,
}: VirtualizedMessageListProps) {
	const hasRestoredScrollRef = useRef(false);
	// Use setting to limit overscan so we rarely render more than maxRenderedMessages; avoid slicing
	// virtualItems so we never unmount rows (unmount clears measurements and causes scroll jump).
	const maxRendered = Math.max(1, Math.floor(Number(maxRenderedMessages)));
	const overscan = Math.min(OVERSCAN, Math.max(0, Math.floor(maxRendered / 2) - 2));

	const virtualizer = useVirtualizer({
		count: messages.length,
		getScrollElement: () => scrollContainerRef?.current ?? null,
		estimateSize: () => ESTIMATE_SIZE,
		overscan,
		getItemKey: (index: number) => messages[index]?._id ?? index,
	});

	const virtualItems = virtualizer.getVirtualItems();
	const totalSize = virtualizer.getTotalSize();

	// Restore scroll position when returning to a channel (after virtual list has laid out).
	useEffect(() => {
		if (hasRestoredScrollRef.current || totalSize <= 0) {
			return;
		}
		const store = RoomManager.getStore(rid);
		if (store?.scroll == null || store.atBottom) {
			return;
		}
		hasRestoredScrollRef.current = true;
		virtualizer.scrollToOffset(store.scroll, { align: 'start' });
	}, [rid, totalSize, virtualizer]);

	if (messages.length === 0) {
		return null;
	}

	return (
		<Box
			is='li'
			style={{
				listStyle: 'none',
				position: 'relative',
				display: 'block',
				width: '100%',
			}}
		>
			<Box
				style={{
					height: `${totalSize}px`,
					width: '100%',
					position: 'relative',
				}}
			>
				{virtualItems.map((virtualRow: VirtualItem) => {
					const message = messages[virtualRow.index];
					if (!message) {
						return null;
					}
					const previous = messages[virtualRow.index - 1];
					const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
					const showUnreadDivider = firstUnreadMessageId === message._id;
					const system = MessageTypes.isSystemMessage(message);
					const visible = !isThreadMessage(message) && !system;

					return (
						<Box
							key={virtualRow.key}
							data-index={virtualRow.index}
							ref={virtualizer.measureElement}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<MessageListItem
								message={message}
								previous={previous}
								showUnreadDivider={showUnreadDivider}
								showUserAvatar={showUserAvatar}
								sequential={sequential}
								visible={visible}
								subscription={subscription}
								system={system}
							/>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}
