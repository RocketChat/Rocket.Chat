import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MutableRefObject } from 'react';

import { VirtualizedMessageList } from './VirtualizedMessageList';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useMessages } from './hooks/useMessages';
import MessageListProvider from './providers/MessageListProvider';

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
	scrollContainerRef?: MutableRefObject<HTMLElement | null>;
};

export const MessageList = function MessageList({ rid, messageListRef, scrollContainerRef }: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
	const maxRenderedMessages = useSetting('Message_VirtualList_MaxRendered', 50);
	const firstUnreadMessageId = useFirstUnreadMessageId();

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				<VirtualizedMessageList
					rid={rid}
					messages={messages}
					scrollContainerRef={scrollContainerRef}
					messageGroupingPeriod={messageGroupingPeriod}
					firstUnreadMessageId={firstUnreadMessageId}
					showUserAvatar={showUserAvatar}
					subscription={subscription}
					maxRenderedMessages={maxRenderedMessages}
				/>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
