import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { MessageDivider } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import { differenceInSeconds } from 'date-fns';
import type { ReactElement } from 'react';
import React, { Fragment } from 'react';

import { MessageTypes } from '../../../../../../app/ui-utils/client';
import { isTruthy } from '../../../../../../lib/isTruthy';
import SystemMessage from '../../../../../components/message/variants/SystemMessage';
import ThreadMessage from '../../../../../components/message/variants/ThreadMessage';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { isMessageFirstUnread } from '../../../MessageList/lib/isMessageFirstUnread';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import { isOwnUserMessage } from '../../../MessageList/lib/isOwnUserMessage';
import { MessageListProvider } from '../../../MessageList/providers/MessageListProvider';
import LoadingMessagesIndicator from '../../../components/body/LoadingMessagesIndicator';
import { useRoomSubscription } from '../../../contexts/RoomContext';
import MessageProvider from '../../../providers/MessageProvider';
import { useLegacyThreadMessageJump } from '../hooks/useLegacyThreadMessageJump';
import { useLegacyThreadMessageListScrolling } from '../hooks/useLegacyThreadMessageListScrolling';
import { useLegacyThreadMessages } from '../hooks/useLegacyThreadMessages';

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
	jumpTo?: string;
	onJumpTo?: (mid: IMessage['_id']) => void;
};

const ThreadMessageList = ({ mainMessage, jumpTo, onJumpTo }: ThreadMessageListProps): ReactElement => {
	const { messages, loading } = useLegacyThreadMessages(mainMessage._id);
	const { listWrapperRef: listWrapperScrollRef, listRef: listScrollRef, onScroll: handleScroll } = useLegacyThreadMessageListScrolling();
	const { parentRef: listJumpRef } = useLegacyThreadMessageJump(jumpTo, { enabled: !loading, onJumpTo });

	const listRef = useMergedRefs<HTMLElement | null>(listScrollRef, listJumpRef);
	const hideUsernames = useUserPreference<boolean>('hideUsernames');

	const subscription = useRoomSubscription();
	const formatDate = useFormatDate();
	const t = useTranslation();
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));

	return (
		<div
			ref={listWrapperScrollRef}
			className={['thread-list js-scroll-thread', hideUsernames && 'hide-usernames'].filter(isTruthy).join(' ')}
			style={{ scrollBehavior: 'smooth' }}
			onScroll={handleScroll}
		>
			<ul ref={listRef} className='thread'>
				{loading ? (
					<li className='load-more'>
						<LoadingMessagesIndicator />
					</li>
				) : (
					<MessageListProvider rid={mainMessage.rid}>
						<MessageProvider rid={mainMessage.rid} broadcast={subscription?.broadcast ?? false}>
							<MessageDivider
								unreadLabel={isMessageFirstUnread(subscription, mainMessage, undefined) ? t('Unread_Messages').toLowerCase() : undefined}
							>
								{formatDate(mainMessage.ts)}
							</MessageDivider>
							<li key={mainMessage._id}>
								<ThreadMessage message={mainMessage} sequential={false} subscription={subscription} />
							</li>
							{messages.map((message, index, { [index - 1]: previous = mainMessage }) => {
								const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
								const newDay = isMessageNewDay(message, previous);
								const firstUnread = isMessageFirstUnread(subscription, message, previous);
								const own = isOwnUserMessage(message, subscription);
								const showDivider = newDay || firstUnread;

								const shouldShowAsSequential = sequential && !newDay;

								const system = MessageTypes.isSystemMessage(message);

								return (
									<Fragment key={message._id}>
										{showDivider && (
											<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
												{newDay && formatDate(message.ts)}
											</MessageDivider>
										)}
										<li>
											{system ? (
												<SystemMessage
													message={message}
													data-id={message._id}
													data-system-message={Boolean(message.t)}
													data-mid={message._id}
													data-unread={firstUnread}
													data-sequential={shouldShowAsSequential}
													data-own={own}
													data-qa-type='message'
												/>
											) : (
												<ThreadMessage
													message={message}
													sequential={shouldShowAsSequential}
													subscription={subscription}
													data-id={message._id}
													data-system-message={Boolean(message.t)}
													data-mid={message._id}
													data-unread={firstUnread}
													data-sequential={shouldShowAsSequential}
													data-own={own}
													data-qa-type='message'
												/>
											)}
										</li>
									</Fragment>
								);
							})}
						</MessageProvider>
					</MessageListProvider>
				)}
			</ul>
		</div>
	);
};

export default ThreadMessageList;
