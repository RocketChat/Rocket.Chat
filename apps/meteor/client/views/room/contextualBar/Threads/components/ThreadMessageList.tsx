import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { MessageTypes } from '@rocket.chat/message-types';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { differenceInSeconds } from 'date-fns';
import type { ReactElement } from 'react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { ThreadMessageItem } from './ThreadMessageItem';
import { isTruthy } from '../../../../../../lib/isTruthy';
import { BubbleDate } from '../../../BubbleDate';
import { useJumpToMessageImperative } from '../../../MessageList/hooks/useJumpToMessage';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../../MessageList/providers/MessageListProvider';
import LoadingMessagesIndicator from '../../../body/LoadingMessagesIndicator';
import { useDateScroll } from '../../../hooks/useDateScroll';
import { useFirstUnreadMessageId } from '../../../hooks/useFirstUnreadMessageId';
import { useMessageListNavigation } from '../../../hooks/useMessageListNavigation';
import { useLegacyThreadMessageListScrolling } from '../hooks/useLegacyThreadMessageListScrolling';
import { useLegacyThreadMessages } from '../hooks/useLegacyThreadMessages';
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
	const { innerRef, bubbleRef, listStyle, ...bubbleDate } = useDateScroll();

	const { messages, loading } = useLegacyThreadMessages(mainMessage._id);

	const { innerRef: listScrollRef, jumpToRef } = useLegacyThreadMessageListScrolling(mainMessage);

	const { jumpToRef: jumpToRefGetMoreImperative, innerRef: jumpToRefGetMoreImperativeInnerRef } = useJumpToMessageImperative();

	const customScrollbarsRef = useMergedRefs(listScrollRef, jumpToRefGetMoreImperativeInnerRef);

	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);

	const { messageListRef } = useMessageListNavigation();

	const jumpToRefMessageListProvider = useMergedRefs(jumpToRef, jumpToRefGetMoreImperative);

	return (
		<div className={['thread-list js-scroll-thread', hideUsernames && 'hide-usernames'].filter(isTruthy).join(' ')}>
			<BubbleDate ref={bubbleRef} {...bubbleDate} />
			<CustomScrollbars ref={customScrollbarsRef} style={{ scrollBehavior: 'smooth', overflowX: 'hidden' }}>
				<Box
					is='ul'
					className={[listStyle, 'thread']}
					ref={messageListRef}
					aria-label={t('Thread_message_list')}
					style={{ scrollBehavior: 'smooth', overflowX: 'hidden' }}
				>
					{loading ? (
						<li className='load-more'>
							<LoadingMessagesIndicator />
						</li>
					) : (
						<MessageListProvider messageListRef={jumpToRefMessageListProvider}>
							{[mainMessage, ...messages].map((message, index, { [index - 1]: previous }) => {
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
							})}
						</MessageListProvider>
					)}
				</Box>
			</CustomScrollbars>
		</div>
	);
};

export default ThreadMessageList;
