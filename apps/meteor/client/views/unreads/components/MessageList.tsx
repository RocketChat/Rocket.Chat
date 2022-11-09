import { IThreadMessage, IRoom } from '@rocket.chat/core-typings';
import { Box, MessageDivider } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import React, { Fragment, memo, ReactElement } from 'react';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { useFormatDate } from '../../../hooks/useFormatDate';
import Message from '../../room/MessageList/components/Message';
import MessageSystem from '../../room/MessageList/components/MessageSystem';
import { ThreadMessagePreview } from '../../room/MessageList/components/ThreadMessagePreview';
import { isMessageNewDay } from '../../room/MessageList/lib/isMessageNewDay';
import { isMessageSequential } from '../../room/MessageList/lib/isMessageSequential';
import { MessageWithMdEnforced } from '../../room/MessageList/lib/parseMessageTextToAstMarkdown';
import MessageHighlightProvider from '../../room/MessageList/providers/MessageHighlightProvider';
import { MessageProvider } from '../../room/providers/MessageProvider';
import { SelectedMessagesProvider } from '../../room/providers/SelectedMessagesProvider';
import { MessageListProvider } from './MessagesListProvider';

type ThreadType = {
	isThreadMessage: boolean;
};

type MessageListProps = {
	rid: IRoom['_id'];
	messages: Array<MessageWithMdEnforced & ThreadType>;
};

export const MessageList = ({ messages, rid }: MessageListProps): ReactElement => {
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const format = useFormatDate();

	return (
		<>
			<MessageListProvider>
				<MessageProvider rid={rid} broadcast={false}>
					<SelectedMessagesProvider>
						<MessageHighlightProvider>
							{messages.map((message, index, arr) => {
								const previous = arr[index - 1];
								const { isThreadMessage } = message;

								const isSequential = isMessageSequential(message, previous, messageGroupingPeriod);

								const isNewDay = isMessageNewDay(message, previous);
								const shouldShowDivider = isNewDay;

								const shouldShowAsSequential = isSequential && !isNewDay;

								const isSystemMessage = MessageTypes.isSystemMessage(message);
								const shouldShowMessage = !isThreadMessage && !isSystemMessage;

								return (
									<Fragment key={index}>
										{shouldShowDivider && (
											<MessageDivider>
												{isNewDay && format(message.ts)}
												{isThreadMessage && <Box fontWeight={400}>{'Reply from thread'}</Box>}
											</MessageDivider>
										)}

										{shouldShowMessage && (
											<Message
												id={message._id}
												data-id={message._id}
												data-system-message={Boolean(message.t)}
												data-mid={message._id}
												data-unread={true}
												data-sequential={isSequential}
												data-own={true}
												data-qa-type='message'
												sequential={shouldShowAsSequential}
												message={message}
												unread={true}
												mention={true}
												all={true}
												unreadSection={true}
											/>
										)}

										{isThreadMessage && (
											<ThreadMessagePreview
												data-system-message={Boolean(message.t)}
												data-mid={message._id}
												data-tmid={message.tmid}
												data-unread={true}
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
		</>
	);
};

export default memo(MessageList);
