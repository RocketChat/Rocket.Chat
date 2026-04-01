import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { VirtualItem } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ComponentProps, MutableRefObject, RefObject } from 'react';

import { MessageListItem } from './MessageListItem';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';

const ESTIMATE_SIZE = 84;
const OVERSCAN = 5;
const DEFAULT_MAX_RENDERED = 50;

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
	scrollContainerRef: RefObject<HTMLElement>;
	totalSize: MutableRefObject<number>;
};

export const MessageList = function MessageList({ rid, messageListRef, scrollContainerRef, totalSize }: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
	const firstUnreadMessageId = useFirstUnreadMessageId();

	const virtualizer = useVirtualizer<HTMLElement, Element>({
		count: messages?.length ?? 0,
		getScrollElement: () => scrollContainerRef.current,
		estimateSize: () => ESTIMATE_SIZE,
		overscan: Math.min(OVERSCAN, Math.max(0, Math.floor(DEFAULT_MAX_RENDERED / 2) - 2)),
		getItemKey: (index: number) => messages[index]?._id ?? index,
		useFlushSync: false,
		onChange: (instance) => {
			totalSize.current = instance.getTotalSize();
		},
	});

	const virtualItems = virtualizer.getVirtualItems();

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
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
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
