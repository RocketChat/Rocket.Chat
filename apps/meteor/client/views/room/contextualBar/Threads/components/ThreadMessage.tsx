// import type { IMessage, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
// import { Box, Bubble, MessageDivider } from '@rocket.chat/fuselage';
// import React from 'react';

// import { MessageTypes } from '../../../../../../app/ui-utils/client';
// import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
// import { isMessageSequential } from '../../../MessageList/lib/isMessageSequential';
// import SystemMessage from '/client/components/message/variants/SystemMessage';

// type ThreadMessageProps = {
// 	message: IMessage;
// 	previous: IThreadMessage | IThreadMainMessage;
// 	messageGroupingPeriod: number;
// 	firstUnreadMessageId: string;
// };

// export const ThreadMessage = ({ message, previous, messageGroupingPeriod, firstUnreadMessageId }: ThreadMessageProps) => {
// 	const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
// 	const newDay = isMessageNewDay(message, previous);
// 	const firstUnread = firstUnreadMessageId === message._id;
// 	const showDivider = newDay || firstUnread;
// 	const system = MessageTypes.isSystemMessage(message);
// 	const shouldShowAsSequential = sequential && !newDay;

// 	return (
// 		<>
// 			{showDivider && (
// 				<Box
// 					// ref={(() => {
// 					// 	let remove: () => void;
// 					// 	return (ref: HTMLElement | null) => {
// 					// 		if (remove) remove();

// 					// 		if (!ref) return;
// 					// 		remove = addToList(ref);
// 					// 	};
// 					// })()}
// 					ref={useDateRef()}
// 					data-id={formatDate(message.ts)}
// 				>
// 					<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
// 						{newDay && (
// 							<Bubble small secondary>
// 								{formatDate(message.ts)}
// 							</Bubble>
// 						)}
// 					</MessageDivider>
// 				</Box>
// 			)}
// 			<li>
// 				{system ? (
// 					<SystemMessage message={message} showUserAvatar={showUserAvatar} />
// 				) : (
// 					<ThreadMessage message={message} sequential={shouldShowAsSequential} unread={firstUnread} showUserAvatar={showUserAvatar} />
// 				)}
// 			</li>
// 		</>
// 	);
// };
