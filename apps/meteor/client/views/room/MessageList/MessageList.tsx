import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { RefObject } from 'react';
import React, { forwardRef } from 'react';

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
	scrollRef: RefObject<HTMLElement>;
};

export const MessageList = forwardRef(function MessageList({ rid, scrollRef }: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const firstUnreadMessageId = useFirstUnreadMessageId();

	return (
		<MessageListProvider scrollRef={scrollRef}>
			<SelectedMessagesProvider>
				{messages.map((message, index, { [index - 1]: previous }) => {
					const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
					const showUnreadDivider = firstUnreadMessageId === message._id;
					const system = MessageTypes.isSystemMessage(message);
					const visible = !isThreadMessage(message) && !system;

					return (
						<MessageListItem
							key={message._id}
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
				})}
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
});
