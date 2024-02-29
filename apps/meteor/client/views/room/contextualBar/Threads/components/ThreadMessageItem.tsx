import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { Box, Bubble, MessageDivider } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { MessageTypes } from '../../../../../../app/ui-utils/client';
import SystemMessage from '../../../../../components/message/variants/SystemMessage';
import ThreadMessage from '../../../../../components/message/variants/ThreadMessage';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import { useFirstUnreadMessageId } from '../../../hooks/useFirstUnreadMessageId';
import { useDateListController } from '../../../providers/DateListProvider';

type ThreadMessageProps = {
	message: IThreadMessage | IThreadMainMessage;
	previous: IThreadMessage | IThreadMainMessage;
	sequential: boolean;
	shouldShowAsSequential: boolean;
	showUserAvatar: boolean;
};

export const ThreadMessageItem = ({ message, previous, shouldShowAsSequential, showUserAvatar }: ThreadMessageProps) => {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const { useDateRef } = useDateListController();
	const ref = useDateRef();
	const newDay = isMessageNewDay(message, previous);

	const firstUnreadMessageId = useFirstUnreadMessageId();
	const firstUnread = firstUnreadMessageId === message._id;
	const showDivider = newDay || firstUnread;
	const system = MessageTypes.isSystemMessage(message);

	return (
		<>
			{showDivider && (
				<Box ref={ref} data-id={formatDate(message.ts)}>
					<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
						{newDay && (
							<Bubble small secondary>
								{formatDate(message.ts)}
							</Bubble>
						)}
					</MessageDivider>
				</Box>
			)}
			<li>
				{system ? (
					<SystemMessage message={message} showUserAvatar={showUserAvatar} />
				) : (
					<ThreadMessage message={message} sequential={shouldShowAsSequential} unread={firstUnread} showUserAvatar={showUserAvatar} />
				)}
			</li>
		</>
	);
};
