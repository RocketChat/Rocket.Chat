import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { isTruthy } from '@rocket.chat/tools';
import { clientCallbacks, CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import { useSetting, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { differenceInSeconds } from 'date-fns';
import type { ReactElement } from 'react';
import { Fragment, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { VirtualizerHandle } from 'virtua';
import { VList } from 'virtua';

import { ThreadMessageItem } from './ThreadMessageItem';
import { BubbleDate } from '../../../BubbleDate';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../../MessageList/providers/MessageListProvider';
import LoadingMessagesIndicator from '../../../body/LoadingMessagesIndicator';
import { useRoom } from '../../../contexts/RoomContext';
import { useDateScroll } from '../../../hooks/useDateScroll';
import { useFirstUnreadMessageId } from '../../../hooks/useFirstUnreadMessageId';
import { useMessageListNavigation } from '../../../hooks/useMessageListNavigation';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';
import './threads.css';

const isMessageSequential = (current: IMessage, previous: IMessage | undefined, groupingRange: number): boolean => {
	if (!previous) {
		return false;
	}

	if (MessageTypes.isSystemMessage(current) || MessageTypes.isSystemMessage(previous)) {
		return false;
	}

	if (current.groupable === false) {
		return false;
	}

	if (current.u._id !== previous.u._id) {
		return false;
	}

	if (current.alias !== previous.alias) {
		return false;
	}
	return differenceInSeconds(current.ts, previous.ts) < groupingRange && !isMessageNewDay(current, previous);
};

type ThreadMessageListProps = {
	mainMessage: IThreadMainMessage;
};

const ThreadMessageList = ({ mainMessage }: ThreadMessageListProps): ReactElement => {
	const { t } = useTranslation();
	const { bubbleRef, handleDateScroll, ...bubbleDate } = useDateScroll();

	const { data: messages = [], isLoading: loading } = useThreadMessagesQuery(mainMessage._id);

	const room = useRoom();
	const uid = useUserId();

	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);

	const { messageListRef } = useMessageListNavigation();

	const virtualizerRef = useRef<VirtualizerHandle | null>(null);
	const isAtBottom = useRef(true);

	const items = loading ? [] : [mainMessage, ...messages];

	useEffect(() => {
		const handle = virtualizerRef.current;
		if (!handle) return;
		if (loading) return;
		if (isAtBottom.current) {
			handle.scrollToIndex(items.length, { align: 'end' });
		}
	}, [loading, items.length]);

	useEffect(() => {
		const handlerId = `thread-scroll-${mainMessage._id}`;
		clientCallbacks.add(
			'afterSaveMessage',
			(msg: IMessage) => {
				if (msg.rid !== room._id || isEditedMessage(msg) || msg.tmid !== mainMessage._id) {
					return;
				}
				if (msg.u._id === uid) {
					isAtBottom.current = true;
				}
			},
			clientCallbacks.priority.MEDIUM,
			handlerId,
		);

		return () => {
			clientCallbacks.remove('afterSaveMessage', handlerId);
		};
	}, [room._id, uid, mainMessage._id]);

	return (
		<div className={['thread-list js-scroll-thread', hideUsernames && 'hide-usernames'].filter(isTruthy).join(' ')}>
			<BubbleDate ref={bubbleRef} {...bubbleDate} />
			<CustomVirtuaScrollbars ref={messageListRef}>
				<MessageListProvider>
					<VList
						ref={virtualizerRef}
						style={{ height: '100%' }}
						aria-label={t('Thread_message_list')}
						aria-busy={loading}
						onScroll={(offset: number) => {
							const handle = virtualizerRef.current;
							if (!handle) return;
							isAtBottom.current = offset - handle.scrollSize + handle.viewportSize >= -20;

							const topMessage = items[handle.findItemIndex(handle.scrollOffset)];
							handleDateScroll(topMessage);
						}}
					>
						{loading ? (
							<li className='load-more'>
								<LoadingMessagesIndicator />
							</li>
						) : (
							items.map((message, index, { [index - 1]: previous }) => {
								const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
								const newDay = isMessageNewDay(message, previous);
								const shouldShowAsSequential = sequential && !newDay;
								const firstUnread = firstUnreadMessageId === message._id;
								const system = MessageTypes.isSystemMessage(message);

								return (
									<Fragment key={message._id}>
										<ThreadMessageItem
											message={message}
											previous={previous}
											sequential={sequential}
											shouldShowAsSequential={shouldShowAsSequential}
											showUserAvatar={showUserAvatar}
											firstUnread={firstUnread}
											system={system}
										/>
									</Fragment>
								);
							})
						)}
					</VList>
				</MessageListProvider>
			</CustomVirtuaScrollbars>
		</div>
	);
};

export default ThreadMessageList;
