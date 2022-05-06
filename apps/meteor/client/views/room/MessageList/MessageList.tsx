import { isThreadMessage, IThreadMessage, IRoom } from '@rocket.chat/core-typings';
import { MessageDivider } from '@rocket.chat/fuselage';
import { useUserSubscription, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, Fragment, memo } from 'react';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { MessageProvider } from '../providers/MessageProvider';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import MessageListErrorBoundary from './MessageListErrorBoundary';
import Message from './components/Message';
import MessageSystem from './components/MessageSystem';
import { ThreadMessagePreview } from './components/ThreadMessagePreview';
import { useMessages } from './hooks/useMessages';
import { isMessageFirstUnread } from './lib/isMessageFirstUnread';
import { isMessageNewDay } from './lib/isMessageNewDay';
import { isMessageSequential } from './lib/isMessageSequential';
import { isOwnUserMessage } from './lib/isOwnUserMessage';
import MessageHighlightProvider from './providers/MessageHighlightProvider';
import { MessageListProvider } from './providers/MessageListProvider';

export const MessageList: FC<{ rid: IRoom['_id'] }> = ({ rid }) => {
	const t = useTranslation();
	const messages = useMessages({ rid });
	const subscription = useUserSubscription(rid);
	const isBroadcast = Boolean(subscription?.broadcast);
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const format = useFormatDate();

	return (
		<MessageListErrorBoundary>
			<MessageListProvider rid={rid}>
				<MessageProvider rid={rid} broadcast={isBroadcast}>
					<SelectedMessagesProvider>
						<MessageHighlightProvider>
							{messages.map((message, index, arr) => {
								const previous = arr[index - 1];

								const isSequential = isMessageSequential(message, previous, messageGroupingPeriod);

								const isNewDay = isMessageNewDay(message, previous);
								const isFirstUnread = isMessageFirstUnread(subscription, message, previous);
								const isUserOwnMessage = isOwnUserMessage(message, subscription);
								const shouldShowDivider = isNewDay || isFirstUnread;

								const shouldShowAsSequential = isSequential && !isNewDay;

								const isSystemMessage = MessageTypes.isSystemMessage(message);
								const shouldShowMessage = !isThreadMessage(message) && !isSystemMessage;

								return (
									<Fragment key={message._id}>
										{shouldShowDivider && (
											<MessageDivider unreadLabel={isFirstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
												{isNewDay && format(message.ts)}
											</MessageDivider>
										)}

										{shouldShowMessage && (
											<Message
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
										)}

										{isThreadMessage(message) && (
											<ThreadMessagePreview
												data-system-message={Boolean(message.t)}
												data-mid={message._id}
												data-tmid={message.tmid}
												data-unread={isFirstUnread}
												data-sequential={isSequential}
												sequential={shouldShowAsSequential}
												message={message as IThreadMessage}
											/>
										)}

										{isSystemMessage && <MessageSystem message={message} />}
									</Fragment>
								);
							})}
						</MessageHighlightProvider>
					</SelectedMessagesProvider>
				</MessageProvider>
			</MessageListProvider>
		</MessageListErrorBoundary>
	);
};

export default memo(MessageList);
