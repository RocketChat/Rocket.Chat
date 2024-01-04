import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { useSetting, useTranslation, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import React, { Fragment } from 'react';

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
	const userId = useUserId();
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const firstUnreadMessageId = useFirstUnreadMessageId();

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				{messages.map((message, index, { [index - 1]: previous }) => {
					const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
					const showUnreadDivider = firstUnreadMessageId === message._id;
					const system = MessageTypes.isSystemMessage(message); 
					const shouldHideBecauseMarkedAsDone = message.markedAsDone && userId ? message.markedAsDone.some((marker : any) => marker._id === userId) : false;

					const visible = !isThreadMessage(message) && !system && !shouldHideBecauseMarkedAsDone;

					return (
						<Fragment key={message._id}>
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
						</Fragment>
					);
				})}
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
