import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { Box, Bubble, MessageDivider } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import { differenceInSeconds } from 'date-fns';
import type { ReactElement } from 'react';
import React, { Fragment } from 'react';

import { MessageTypes } from '../../../../../../app/ui-utils/client';
import { isTruthy } from '../../../../../../lib/isTruthy';
import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';
import SystemMessage from '../../../../../components/message/variants/SystemMessage';
import ThreadMessage from '../../../../../components/message/variants/ThreadMessage';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../../MessageList/providers/MessageListProvider';
import LoadingMessagesIndicator from '../../../body/LoadingMessagesIndicator';
import { useDateScroll } from '../../../hooks/useDateScroll';
import { useFirstUnreadMessageId } from '../../../hooks/useFirstUnreadMessageId';
import { useMessageListNavigation } from '../../../hooks/useMessageListNavigation';
import { useScrollMessageList } from '../../../hooks/useScrollMessageList';
import { useDateController } from '../../../providers/DateScrollProvider';
import { useLegacyThreadMessageJump } from '../hooks/useLegacyThreadMessageJump';
import { useLegacyThreadMessageListScrolling } from '../hooks/useLegacyThreadMessageListScrolling';
import { useLegacyThreadMessages } from '../hooks/useLegacyThreadMessages';

const BUBBLE_OFFSET = 64;

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
	const { addToList, list } = useDateController();
	const { bubbleDate, onScroll: handleDateOnScroll, showBubble, style: bubbleDateStyle } = useDateScroll(BUBBLE_OFFSET);

	const { messages, loading } = useLegacyThreadMessages(mainMessage._id);
	const {
		listWrapperRef: listWrapperScrollRef,
		listRef: listScrollRef,
		onScroll: handleScroll,
	} = useLegacyThreadMessageListScrolling(mainMessage);
	const { parentRef: listJumpRef } = useLegacyThreadMessageJump({ enabled: !loading });

	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');

	const formatDate = useFormatDate();
	const t = useTranslation();
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));

	const scrollMessageList = useScrollMessageList(listWrapperScrollRef);

	const firstUnreadMessageId = useFirstUnreadMessageId();
	const { messageListRef, messageListProps } = useMessageListNavigation();

	const listRef = useMergedRefs<HTMLElement | null>(listScrollRef, listJumpRef, messageListRef);

	return (
		<div className={['thread-list js-scroll-thread', hideUsernames && 'hide-usernames'].filter(isTruthy).join(' ')}>
			{bubbleDate && (
				<Box className={[bubbleDateStyle, showBubble && 'bubble-visible']}>
					<Bubble small secondary>
						{bubbleDate}
					</Bubble>
				</Box>
			)}
			<ScrollableContentWrapper
				ref={listWrapperScrollRef}
				onScroll={(args) => {
					handleScroll(args);
					handleDateOnScroll(list);
				}}
				style={{ scrollBehavior: 'smooth', overflowX: 'hidden' }}
			>
				<ul className='thread' ref={listRef} style={{ scrollBehavior: 'smooth', overflowX: 'hidden' }} {...messageListProps}>
					{loading ? (
						<li className='load-more'>
							<LoadingMessagesIndicator />
						</li>
					) : (
						<MessageListProvider scrollMessageList={scrollMessageList}>
							{[mainMessage, ...messages].map((message, index, { [index - 1]: previous }) => {
								const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
								const newDay = isMessageNewDay(message, previous);
								const firstUnread = firstUnreadMessageId === message._id;
								const showDivider = newDay || firstUnread;

								const shouldShowAsSequential = sequential && !newDay;

								const system = MessageTypes.isSystemMessage(message);

								return (
									<Fragment key={message._id}>
										{showDivider && (
											<Box
												ref={(() => {
													let remove: () => void;
													return (ref: HTMLElement | null) => {
														if (remove) remove();

														if (!ref) return;
														remove = addToList(ref);
													};
												})()}
												data-id={formatDate(message.ts)}
											>
												<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
													{newDay && (
														<Bubble small secondary>
															{formatDate(message.ts)}
														</Bubble>
													)}
												</MessageDivider>
											</Box>
										)}
										<li>
											{system ? (
												<SystemMessage message={message} showUserAvatar={showUserAvatar} />
											) : (
												<ThreadMessage
													message={message}
													sequential={shouldShowAsSequential}
													unread={firstUnread}
													showUserAvatar={showUserAvatar}
												/>
											)}
										</li>
									</Fragment>
								);
							})}
						</MessageListProvider>
					)}
				</ul>
			</ScrollableContentWrapper>
		</div>
	);
};

export default ThreadMessageList;
