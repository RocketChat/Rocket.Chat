import type { IRoom, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import type { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { useEffect, type MutableRefObject } from 'react';

import { MessageListItem } from './MessageListItem';
import { isMessageSequential } from './lib/isMessageSequential';

type VirtualizedMessageListProps = {
	rid: IRoom['_id'];
	messages: IMessage[];
	scrollContainerRef?: MutableRefObject<HTMLElement | null>;
	messageGroupingPeriod: number;
	firstUnreadMessageId: string | undefined;
	showUserAvatar: boolean;
	subscription: ISubscription | undefined;
	virtualItems: VirtualItem[];
	virtualizer: ReturnType<typeof useVirtualizer>;
};

export function VirtualizedMessageList({
	messages,
	virtualItems,
	messageGroupingPeriod,
	firstUnreadMessageId,
	showUserAvatar,
	subscription,
	virtualizer,
}: VirtualizedMessageListProps) {
	if (messages.length === 0 || virtualItems.length === 0) {
		return null;
	}

	return (
		<>
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
		</>
	);
}
