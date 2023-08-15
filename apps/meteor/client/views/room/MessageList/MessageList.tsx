import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { MessageDivider } from '@rocket.chat/fuselage';
import { useSetting, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { Fragment, memo, useMemo, useState } from 'react';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';
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
	scrollMessageList: ComponentProps<typeof MessageListProvider>['scrollMessageList'];
};

export const MessageList = ({ rid, scrollMessageList }: MessageListProps): ReactElement => {
	const t = useTranslation();
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const formatDate = useFormatDate();
	const [firstUnreadMessageId, setFirstUnreadMessage] = useState<string | undefined>();
	const hideUnreadMark = useMemo(
		() =>
			withDebouncing({ wait: 5000 })(() => {
				setFirstUnreadMessage(undefined);
			}),
		[],
	);

	return (
		<MessageListProvider scrollMessageList={scrollMessageList}>
			<SelectedMessagesProvider>
				{messages.map((message, index, { [index - 1]: previous }) => {
					const sequential = isMessageSequential(message, previous, messageGroupingPeriod);

					const newDay = isMessageNewDay(message, previous);
					const isFirstUnread = isMessageFirstUnread(subscription, message, previous);

					if (isFirstUnread && !firstUnreadMessageId) {
						setFirstUnreadMessage(message._id);
					} else if (message._id === firstUnreadMessageId) {
						hideUnreadMark();
					}

					const showUnreadDivider = firstUnreadMessageId === message._id;

					const showDivider = newDay || showUnreadDivider;

					const shouldShowAsSequential = sequential && !newDay;

					const system = MessageTypes.isSystemMessage(message);
					const visible = !isThreadMessage(message) && !system;

					const unread = Boolean(subscription?.tunread?.includes(message._id));
					const mention = Boolean(subscription?.tunreadUser?.includes(message._id));
					const all = Boolean(subscription?.tunreadGroup?.includes(message._id));
					const ignoredUser = Boolean(subscription?.ignored?.includes(message.u._id));

					return (
						<Fragment key={message._id}>
							{showDivider && (
								<MessageDivider unreadLabel={showUnreadDivider ? t('Unread_Messages').toLowerCase() : undefined}>
									{newDay && formatDate(message.ts)}
								</MessageDivider>
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
								<ThreadMessagePreview
									data-mid={message._id}
									data-tmid={message.tmid}
									data-unread={isFirstUnread}
									data-sequential={sequential}
									sequential={shouldShowAsSequential}
									message={message}
									showUserAvatar={showUserAvatar}
								/>
							)}

							{system && <SystemMessage showUserAvatar={showUserAvatar} message={message} />}
						</Fragment>
					);
				})}
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};

export default memo(MessageList);
