import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { MessageDivider } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { Fragment, memo } from 'react';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import RoomMessage from '../../../../../client/components/message/variants/RoomMessage';
import SystemMessage from '../../../../../client/components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import { isMessageNewDay } from '../../../../../client/views/room/MessageList/lib/isMessageNewDay';

type AuditMessageListProps = {
	messages: IMessage[];
};

export const AuditMessageList = ({ messages }: AuditMessageListProps): ReactElement => {
	const t = useTranslation();
	const formatDate = useFormatDate();

	return (
		<>
			{messages.map((message, index, { [index - 1]: previous }) => {
				const newDay = isMessageNewDay(message, previous);
				const firstUnread = false; // isMessageFirstUnread(subscription, message, previous);
				const showDivider = newDay || firstUnread;
				const system = MessageTypes.isSystemMessage(message);
				const visible = !isThreadMessage(message) && !system;

				return (
					<Fragment key={message._id}>
						{showDivider && (
							<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
								{newDay && formatDate(message.ts)}
							</MessageDivider>
						)}

						{visible && <RoomMessage message={message} sequential={false} unread={false} mention={false} all={false} ignoredUser={false} />}

						{system && <SystemMessage message={message} />}
					</Fragment>
				);
			})}
		</>
	);
};

export default memo(AuditMessageList);
