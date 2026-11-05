import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { MessageList, MessageListDateBubble } from '@rocket.chat/ui-message-list';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadMessageRow from './ThreadMessageRow';
import { useThreadJumpTarget } from './useThreadJumpTarget';
import { MessagesProvider } from '../../../../../providers/MessagesProvider';
import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../../../hooks/useFirstUnreadMessageId';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';

export type ThreadMessageListProps = {
	mainMessage: IThreadMainMessage;
};

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
		const replies = data?.messages ?? [];
		return hasPreviousPage ? replies : [mainMessage, ...replies];
	}, [data?.messages, hasPreviousPage, mainMessage]);

	const { targetMessageId, onTargetMessageReached } = useThreadJumpTarget(mainMessage, messages, { isLoading, loadMessageAround });

	const isOwnMessage = useCallback((message: IMessage) => message.u._id === uid, [uid]);

	return (
		<MessagesProvider room={room} subscription={subscription}>
			<Box flexGrow={1} flexShrink={1} minHeight={0} position='relative'>
				<MessageList<IMessage>
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
					renderMessage={(row) => <ThreadMessageRow row={row} subscription={subscription} />}
				>
					<MessageListDateBubble />
				</MessageList>
			</Box>
		</MessagesProvider>
	);
};

export default ThreadMessageList;
