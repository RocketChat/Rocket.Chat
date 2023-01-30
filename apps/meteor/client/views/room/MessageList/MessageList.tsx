import type { IRoom, IThreadMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { MessageDivider } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { Fragment, memo } from 'react';

import { MessageTypes } from '../../../../app/ui-utils/client';
import RoomMessage from '../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../components/message/variants/SystemMessage';
import ThreadMessagePreview from '../../../components/message/variants/ThreadMessagePreview';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useRoomSubscription } from '../contexts/RoomContext';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useMessages } from './hooks/useMessages';
import { isMessageFirstUnread } from './lib/isMessageFirstUnread';
import { isMessageNewDay } from './lib/isMessageNewDay';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';

type MessageListProps = {
	rid: IRoom['_id'];
};

export const MessageList = ({ rid }: MessageListProps): ReactElement => {
	const t = useTranslation();
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const formatDate = useFormatDate();

	return (
		<MessageListProvider>
			<SelectedMessagesProvider>
				{messages.map((message, index, arr) => {
					const previous = arr[index - 1];

					const sequential = isMessageSequential(message, previous, messageGroupingPeriod);

					const newDay = isMessageNewDay(message, previous);
					const firstUnread = isMessageFirstUnread(subscription, message, previous);
					const showDivider = newDay || firstUnread;

					const shouldShowAsSequential = sequential && !newDay;

					const system = MessageTypes.isSystemMessage(message);
					const visible = !isThreadMessage(message) && !system;

					const unread = Boolean(subscription?.tunread?.includes(message._id));
					const mention = Boolean(subscription?.tunreadUser?.includes(message._id));
					const all = Boolean(subscription?.tunreadGroup?.includes(message._id));

					return (
						<Fragment key={message._id}>
							{showDivider && (
								<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
									{newDay && formatDate(message.ts)}
								</MessageDivider>
							)}

							{visible && <RoomMessage message={message} sequential={shouldShowAsSequential} unread={unread} mention={mention} all={all} />}

							{isThreadMessage(message) && (
								<ThreadMessagePreview
									data-mid={message._id}
									data-tmid={message.tmid}
									data-unread={firstUnread}
									data-sequential={sequential}
									sequential={shouldShowAsSequential}
									message={message as IThreadMessage}
								/>
							)}

							{system && <SystemMessage message={message} />}
						</Fragment>
					);
				})}
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};

export default memo(MessageList);
