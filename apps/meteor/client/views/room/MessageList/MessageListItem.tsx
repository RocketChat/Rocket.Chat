import { isThreadMessage, type IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble, MessageDivider } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMessageListFormatDate } from '../../../components/message/list/MessageListContext';
import RoomMessage from '../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../components/message/variants/SystemMessage';
import ThreadMessagePreview from '../../../components/message/variants/ThreadMessagePreview';
import { useDateRef } from '../providers/DateListProvider';

const dividerClassName = css`
	transition: opacity 0.2s ease-out;
`;

export type MessageListItemProps = {
	message: IMessage;
	newDay: boolean;
	showUnreadDivider: boolean;

	sequential: boolean;
	showUserAvatar: boolean;
	visible: boolean;
	unread: boolean;
	mention: boolean;
	all: boolean;
	ignoredUser: boolean;
	system: boolean;
};

export const MessageListItem = memo(function MessageListItem({
	message,
	newDay,
	showUnreadDivider,
	sequential,
	showUserAvatar,
	visible,
	unread,
	mention,
	all,
	ignoredUser,
	system,
}: MessageListItemProps) {
	const { t } = useTranslation();
	const formatDate = useMessageListFormatDate();

	const ref = useDateRef();

	const showDivider = newDay || showUnreadDivider;
	const shouldShowAsSequential = sequential && !newDay;

	return (
		<>
			{showDivider && (
				<Box
					ref={ref}
					data-id={message.ts}
					role='listitem'
					className={dividerClassName}
					{...(newDay && {
						'data-time': new Date(message.ts)
							.toISOString()
							.replaceAll(/[-T:.]/g, '')
							.substring(0, 8),
					})}
				>
					<MessageDivider unreadLabel={showUnreadDivider ? t('Unread_Messages').toLowerCase() : undefined}>
						{newDay && (
							<Bubble small secondary>
								{formatDate(message.ts)}
							</Bubble>
						)}
					</MessageDivider>
				</Box>
			)}
			{visible && (
				<RoomMessage
					message={message}
					showUserAvatar={showUserAvatar}
					sequential={shouldShowAsSequential}
					unread={unread}
					mention={mention}
					all={all}
					ignoredUser={ignoredUser}
				/>
			)}
			{isThreadMessage(message) && (
				<div role='listitem'>
					<ThreadMessagePreview
						data-mid={message._id}
						data-tmid={message.tmid}
						data-unread={showUnreadDivider}
						data-sequential={sequential}
						sequential={shouldShowAsSequential}
						message={message}
						showUserAvatar={showUserAvatar}
					/>
				</div>
			)}
			{system && <SystemMessage showUserAvatar={showUserAvatar} message={message} />}
		</>
	);
});
