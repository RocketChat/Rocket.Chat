import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { MessageListItem } from './MessageListItem';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
};

export const MessageList = function MessageList({ rid, messageListRef }: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const firstUnreadMessageId = useFirstUnreadMessageId();

	const scrollParent: any = messageListRef?.current;

	// Memoize itemContent using useCallback
	const itemContent = useCallback(
		(index: number, message) => {
			const previous = messages[index - 1];
			const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
			const showUnreadDivider = firstUnreadMessageId === message._id;
			const system = MessageTypes.isSystemMessage(message);
			const visible = !isThreadMessage(message) && !system;

			return (
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
			);
		},
		[messages, messageGroupingPeriod, firstUnreadMessageId, showUserAvatar, subscription],
	);

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				<Virtuoso
					// totalCount={messages?.length}
					customScrollParent={scrollParent}
					increaseViewportBy={{
						top: window?.innerHeight || 1000,
						bottom: window?.innerHeight || 1000,
					}}
					computeItemKey={(index) => messages[index]._id}
					data={messages}
					itemContent={itemContent}
					style={{ height: '100%', width: '100%' }}
				/>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
