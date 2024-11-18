import { isThreadMessage, type IMessage, type ISubscription } from '@rocket.chat/core-typings';
import { Box, Bubble, MessageDivider } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import RoomMessage from '../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../components/message/variants/SystemMessage';
import ThreadMessagePreview from '../../../components/message/variants/ThreadMessagePreview';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useDateRef } from '../providers/DateListProvider';
import { isMessageNewDay } from './lib/isMessageNewDay';

type MessageListItemProps = {
	message: IMessage;
	previous?: IMessage;
	showUnreadDivider: boolean;

	sequential: boolean;
	showUserAvatar: boolean;
	visible: boolean;
	subscription: ISubscription | undefined;
	system: boolean;
};

const shouldRenderMessageListItem = (prevProps: any, nextProps: any) => {
	return (
		prevProps.message._id === nextProps.message._id &&
		prevProps.showUnreadDivider === nextProps.showUnreadDivider &&
		prevProps.sequential === nextProps.sequential &&
		prevProps.showUserAvatar === nextProps.showUserAvatar &&
		prevProps.visible === nextProps.visible &&
		prevProps.subscription?.tunread?.includes(prevProps.message._id) === nextProps.subscription?.tunread?.includes(nextProps.message._id) &&
		prevProps.subscription?.tunreadUser?.includes(prevProps.message._id) ===
			nextProps.subscription?.tunreadUser?.includes(nextProps.message._id) &&
		prevProps.subscription?.tunreadGroup?.includes(prevProps.message._id) ===
			nextProps.subscription?.tunreadGroup?.includes(nextProps.message._id) &&
		prevProps.subscription?.ignored?.includes(prevProps.message.u._id) ===
			nextProps.subscription?.ignored?.includes(nextProps.message.u._id) &&
		prevProps.system === nextProps.system
	);
};

export const MessageListItemComponent = ({
	message,
	previous,
	showUnreadDivider,
	sequential,
	showUserAvatar,
	visible,
	subscription,
	system,
}: MessageListItemProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	const ref = useDateRef();

	const newDay = isMessageNewDay(message, previous);
	const showDivider = newDay || showUnreadDivider;
	const unread = Boolean(subscription?.tunread?.includes(message._id));
	const mention = Boolean(subscription?.tunreadUser?.includes(message._id));
	const all = Boolean(subscription?.tunreadGroup?.includes(message._id));
	const ignoredUser = Boolean(subscription?.ignored?.includes(message.u._id));
	const shouldShowAsSequential = sequential && !newDay;

	return (
		<>
			{showDivider && (
				<Box
					ref={ref}
					data-id={message.ts}
					role='listitem'
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
				<li>
					<ThreadMessagePreview
						data-mid={message._id}
						data-tmid={message.tmid}
						data-unread={showUnreadDivider}
						data-sequential={sequential}
						sequential={shouldShowAsSequential}
						message={message}
						showUserAvatar={showUserAvatar}
					/>
				</li>
			)}
			{system && <SystemMessage showUserAvatar={showUserAvatar} message={message} />}
		</>
	);
};

export const MessageListItemVirtual = React.memo(MessageListItemComponent, shouldRenderMessageListItem);
