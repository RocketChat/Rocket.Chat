/* eslint-disable react/no-multi-comp */
import { IThreadMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { MessageDivider } from '@rocket.chat/fuselage';
import { useUserSubscription, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, Fragment, memo, ReactElement } from 'react';
// import { MessageTypes } from '../../../../app/ui-utils/client';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { MessageProvider } from '../providers/MessageProvider';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import MessageListErrorBoundary from './MessageListErrorBoundary';
import ThreadMessage from './components/ThreadMessage/ThreadMessage';
// import MessageSystem from './components/MessageSystem';
// import { ThreadMessagePreview } from './components/ThreadMessagePreview';
import { useThreadMessages } from './hooks/useThreadMessages';
import { isMessageFirstUnread } from './lib/isMessageFirstUnread';
import { isMessageNewDay } from './lib/isMessageNewDay';
import { isOwnUserMessage } from './lib/isOwnUserMessage';
import { isThreadMessageSequential } from './lib/isThreadMessageSequential';
import MessageHighlightProvider from './providers/MessageHighlightProvider';
import { MessageListProvider } from './providers/MessageListProvider';

type ThreadMessageItemProps = {
	message: IThreadMessage;
	previous: IThreadMessage;
	subscription: ISubscription | undefined;
	messageGroupingPeriod: number;
	format: ReturnType<typeof useFormatDate>;
};

export const ThreadMessageItem = ({
	message,
	previous,
	subscription,
	messageGroupingPeriod,
	format,
}: ThreadMessageItemProps): ReactElement => {
	const t = useTranslation();
	const isSequential = isThreadMessageSequential(message, previous, messageGroupingPeriod);

	const isNewDay = isMessageNewDay(message, previous);
	const isFirstUnread = isMessageFirstUnread(subscription, message, previous);
	const isUserOwnMessage = isOwnUserMessage(message, subscription);
	const shouldShowDivider = isNewDay || isFirstUnread;

	const shouldShowAsSequential = isSequential && !isNewDay;

	return (
		<Fragment key={message._id}>
			{shouldShowDivider && (
				<MessageDivider unreadLabel={isFirstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
					{isNewDay && format(message.ts)}
				</MessageDivider>
			)}

			<ThreadMessage
				id={message._id}
				data-id={message._id}
				data-system-message={Boolean(message.t)}
				data-mid={message._id}
				data-unread={isFirstUnread}
				data-sequential={isSequential}
				data-own={isUserOwnMessage}
				data-qa-type='message'
				sequential={shouldShowAsSequential}
				message={message}
				subscription={subscription}
			/>
		</Fragment>
	);
};

export const ThreadMessageList: FC<{ rid: IRoom['_id']; tmid: IThreadMessage['tmid'] }> = ({ rid, tmid }) => {
	const subscription = useUserSubscription(rid);
	const isBroadcast = Boolean(subscription?.broadcast);
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const format = useFormatDate();
	const messages = useThreadMessages({ tmid });
	console.log(messages);
	return (
		<MessageListErrorBoundary>
			<MessageListProvider rid={rid}>
				<MessageProvider rid={rid} broadcast={isBroadcast}>
					<SelectedMessagesProvider>
						<MessageHighlightProvider>
							<Virtuoso
								style={{ height: '100%', width: '100%' }}
								totalCount={messages?.length}
								data={messages}
								components={{ Scroller: ScrollableContentWrapper }}
								followOutput='smooth'
								itemContent={(index, data): ReactElement => (
									<ThreadMessageItem
										previous={messages[index - 1]}
										message={data}
										messageGroupingPeriod={messageGroupingPeriod}
										subscription={subscription}
										format={format}
									/>
								)}
							/>
						</MessageHighlightProvider>
					</SelectedMessagesProvider>
				</MessageProvider>
			</MessageListProvider>
		</MessageListErrorBoundary>
	);
};

export default memo(ThreadMessageList);
