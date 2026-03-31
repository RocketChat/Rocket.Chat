import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MutableRefObject, Ref, RefObject } from 'react';

import type { VirtualizerHandle } from './VirtualizedMessageList';
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
	isLoadingMoreMessages: boolean;
	canPreview: boolean;
	hasMorePreviousMessages: boolean;
	hasMoreNextMessages: boolean;
	user: IUser | null;
	room: IRoom;
	retentionPolicy: RetentionPolicy;
	innerRef: Ref<HTMLElement>;
	virtualizerHandle: RefObject<VirtualizerHandle>;
};

export const MessageList = function MessageList({
	rid,
	messageListRef,
	scrollContainerRef,
	isLoadingMoreMessages,
	canPreview,
	hasMorePreviousMessages,
	hasMoreNextMessages,
	user,
	room,
	retentionPolicy,
	innerRef,
	virtualizerHandle,
}: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
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
					innerRef={innerRef}
					isLoadingMoreMessages={isLoadingMoreMessages}
					canPreview={canPreview}
					hasMorePreviousMessages={hasMorePreviousMessages}
					hasMoreNextMessages={hasMoreNextMessages}
					user={user}
					room={room}
					retentionPolicy={retentionPolicy}
					virtualizerHandle={virtualizerHandle}
				/>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
