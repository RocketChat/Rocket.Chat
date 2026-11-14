import type { IMessage } from '@rocket.chat/core-typings';
import { MessageDivider } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { RoomMessage, SystemMessage } from '@rocket.chat/ui-message-list';
import { Fragment, memo } from 'react';

import { useFormatDate } from '../../../hooks/useFormatDate';
import { isMessageNewDay } from '../../../lib/utils/isMessageNewDay';
import { MessagesProvider } from '../../../providers/MessagesProvider';

export type AuditMessageListProps = {
	messages: IMessage[];
};

const AuditMessageList = ({ messages }: AuditMessageListProps) => {
	const formatDate = useFormatDate();

	return (
		<MessagesProvider allowsInteraction={false}>
			{messages.map((message, index, { [index - 1]: previous }) => {
				const newDay = isMessageNewDay(message, previous);
				const system = MessageTypes.isSystemMessage(message);

				return (
					<Fragment key={message._id}>
						{newDay && <MessageDivider>{formatDate(message.ts)}</MessageDivider>}

						{!system && <RoomMessage message={message} sequential={false} unread={false} mention={false} all={false} ignoredUser={false} />}

						{system && <SystemMessage message={message} />}
					</Fragment>
				);
			})}
		</MessagesProvider>
	);
};

export default memo(AuditMessageList);
