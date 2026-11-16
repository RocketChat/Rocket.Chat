import { isThreadMessage, type IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble, MessageDivider } from '@rocket.chat/fuselage';
import { RoomMessage, SystemMessage, ThreadMessagePreview, useMessageDisplay } from '@rocket.chat/ui-message-list';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRegisterRenderedMessage } from './hooks/useRegisterRenderedMessage';
import { useDateRef } from '../providers/DateListProvider';

const dividerClassName = css`
	transition: opacity 0.2s ease-out;
`;

export type MessageListItemProps = {
	message: IMessage;
	newDay: boolean;
	showUnreadDivider: boolean;

	sequential: boolean;
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
	visible,
	unread,
	mention,
	all,
	ignoredUser,
	system,
}: MessageListItemProps) {
	const { t } = useTranslation();
	const { formatDate } = useMessageDisplay();

	useRegisterRenderedMessage(message._id);

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
					/>
				</div>
			)}
			{system && <SystemMessage message={message} />}
		</>
	);
});
