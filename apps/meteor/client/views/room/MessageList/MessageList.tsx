import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { VirtualScrollbars } from '@rocket.chat/ui-client';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ComponentProps, MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { VirtualizedMessageList } from './VirtualizedMessageList';
import LoadingMessagesIndicator from '../body/LoadingMessagesIndicator';
import RetentionPolicyWarning from '../body/RetentionPolicyWarning';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useMessages } from './hooks/useMessages';
import MessageListProvider from './providers/MessageListProvider';
import RoomForeword from '../body/RoomForeword/RoomForeword';

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
	scrollContainerRef?: MutableRefObject<HTMLElement | null>;
	isLoadingMoreMessages: boolean;
	canPreview: boolean;
	hasMorePreviousMessages: boolean;
	hasMoreNextMessages: boolean;
	user: IUser;
	room: IRoom;
	retentionPolicy: RetentionPolicy;
	innerRef: MutableRefObject<HTMLElement | null>;
};
const ESTIMATE_SIZE = 84;
const OVERSCAN = 5;
const DEFAULT_MAX_RENDERED = 50;

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
}: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);

	const { t } = useTranslation();

	const overscan = Math.min(OVERSCAN, Math.max(0, Math.floor(DEFAULT_MAX_RENDERED / 2) - 2));
	const firstUnreadMessageId = useFirstUnreadMessageId();

	console.log('scrollContainerRef', messages?.length);

	const virtualizer = useVirtualizer<HTMLElement, Element>({
		count: messages?.length ?? 0,
		getScrollElement: () => scrollContainerRef?.current ?? null,
		estimateSize: () => ESTIMATE_SIZE,
		overscan,
		getItemKey: (index: number) => messages[index]?._id ?? index,
	});

	const totalSize = virtualizer.getTotalSize();
	const virtualItems = virtualizer.getVirtualItems();

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				<VirtualScrollbars ref={innerRef} viewportRef={scrollContainerRef} key={room._id}>
					<ul
						className='messages-list'
						aria-label={t('Message_list')}
						aria-busy={isLoadingMoreMessages}
						style={{ height: `${totalSize}px` }}
					>
						{canPreview ? (
							<>
								{hasMorePreviousMessages ? (
									<li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li>
								) : (
									<li>
										<RoomForeword user={user} room={room} />
										{retentionPolicy?.isActive ? <RetentionPolicyWarning room={room} /> : null}
									</li>
								)}
							</>
						) : null}
						{messages.length > 0 && (
							<VirtualizedMessageList
								rid={rid}
								messages={messages}
								scrollContainerRef={scrollContainerRef}
								messageGroupingPeriod={messageGroupingPeriod}
								firstUnreadMessageId={firstUnreadMessageId}
								showUserAvatar={showUserAvatar}
								subscription={subscription}
								virtualItems={virtualItems}
								virtualizer={virtualizer}
							/>
						)}
						{hasMoreNextMessages ? <li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li> : null}
					</ul>
				</VirtualScrollbars>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
