import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import type { MessageListHandle, MessageListMessageRow } from '@rocket.chat/ui-message-list';
import { MessageList, MessageListDateBubble } from '@rocket.chat/ui-message-list';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadMessageRow from './ThreadMessageRow';
import { useScrollToBottomOnOwnReply } from './useScrollToBottomOnOwnReply';
import { useThreadJumpTarget } from './useThreadJumpTarget';
import ListViewport from '../../../../../components/ListViewport';
import { MessagesProvider } from '../../../../../providers/MessagesProvider';
import { MessageMarkers } from '../../../../../providers/MessagesProvider/MessageMarkers';
import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../../../hooks/useFirstUnreadMessageId';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';

/** How far from the end of the latest replies the viewer still counts as being at the bottom, in pixels. */
const BOTTOM_THRESHOLD = 20;

export type ThreadMessageListProps = {
	mainMessage: IThreadMainMessage;
};

const renderMessage = ({ message, isSequential, isFirstUnread }: MessageListMessageRow<IMessage>) => (
	<ThreadMessageRow message={message} isSequential={isSequential} isFirstUnread={isFirstUnread} />
);

/** The replies of a thread, under its main message once no older reply remains to load. */
const ThreadMessageList = ({ mainMessage }: ThreadMessageListProps) => {
	const { t } = useTranslation();
	const room = useRoom();
	const subscription = useRoomSubscription();
	const uid = useUserId();
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const groupingPeriodSeconds = useSetting('Message_GroupingPeriod', 300);

	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		fetchPreviousPage,
		hasPreviousPage,
		isFetchingPreviousPage,
		loadMessageAround,
		jumpToRecent,
	} = useThreadMessagesQuery(mainMessage._id);

	const messages = useMemo(() => {
		if (isLoading) {
			return [];
		}
		const replies = data?.messages ?? [];
		return hasPreviousPage ? replies : [mainMessage, ...replies];
	}, [isLoading, data?.messages, hasPreviousPage, mainMessage]);

	const { targetMessageId, onTargetMessageReached } = useThreadJumpTarget(mainMessage, messages, { isLoading, loadMessageAround });

	const listRef = useRef<MessageListHandle>(null);
	useScrollToBottomOnOwnReply(room._id, mainMessage._id, listRef);

	const isOwnMessage = useCallback((message: IMessage) => message.u._id === uid, [uid]);

	return (
		<MessagesProvider room={room} subscription={subscription}>
			<MessageMarkers subscription={subscription}>
				<ListViewport>
					<MessageList<IMessage>
						ref={listRef}
						aria-label={t('Thread_message_list')}
						messages={messages}
						hasOlderMessages={hasPreviousPage}
						hasNewerMessages={hasNextPage}
						isLoadingInitialMessages={isLoading}
						isLoadingOlderMessages={isFetchingPreviousPage}
						isLoadingNewerMessages={isFetchingNextPage}
						onLoadOlderMessages={fetchPreviousPage}
						onLoadNewerMessages={fetchNextPage}
						onJumpToLatest={jumpToRecent}
						firstUnreadMessageId={firstUnreadMessageId}
						targetMessageId={targetMessageId}
						onTargetMessageReached={onTargetMessageReached}
						isOwnMessage={isOwnMessage}
						groupingPeriodSeconds={groupingPeriodSeconds}
						groupsThreadReplies={false}
						bottomThreshold={BOTTOM_THRESHOLD}
						deferPagingUntilInput
						renderMessage={renderMessage}
					>
						<MessageListDateBubble />
					</MessageList>
				</ListViewport>
			</MessageMarkers>
		</MessagesProvider>
	);
};

export default ThreadMessageList;
