import type { IMessage } from '@rocket.chat/core-typings';
import { MessageDivider } from '@rocket.chat/fuselage';
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
	const formatDate = useFormatDate();

	return (
		<>
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
		</>
	);
};

export default memo(AuditMessageList);
