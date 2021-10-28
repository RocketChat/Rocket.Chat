import { MessageDivider } from '@rocket.chat/fuselage';
import React, { FC, Fragment } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useUserSubscription } from '../../../contexts/UserContext';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { MessageProvider } from '../providers/MessageProvider';
import Message from './components/Message';
import { useMessages } from './hooks/useMessages';
import { isMessageNewDay } from './lib/isMessageNewDay';
import { isMessageSequential } from './lib/isMessageSequential';
import { isMessageUnread } from './lib/isMessageUnread';

export const MessageList: FC<{ rid: IRoom['_id'] }> = ({ rid }) => {
	// const room = useRoom() as IRoom;

	const t = useTranslation();
	const messages = useMessages({ rid });
	const subscription = useUserSubscription(rid);
	const format = useFormatDate();
	return (
		<MessageProvider>
			{messages.map((message, index, arr) => {
				const previous = arr[index - 1];

				const newDay = isMessageNewDay(message, previous);
				const sequential = isMessageSequential(message, previous);
				const unread = isMessageUnread(subscription, message);

				const shouldShowDivider = newDay || unread;

				const shouldShowAsSequential = sequential && !newDay;

				return (
					<Fragment key={message._id}>
						{shouldShowDivider && (
							<MessageDivider unreadLabel={unread ? t('Unread_Messages').toLowerCase() : undefined}>
								{newDay && format(message.ts)}
							</MessageDivider>
						)}
						<Message
							data-mid={message._id}
							data-unread={unread}
							sequential={shouldShowAsSequential}
							message={message}
						/>
					</Fragment>
				);
			})}
		</MessageProvider>
	);
};

export default MessageList;
