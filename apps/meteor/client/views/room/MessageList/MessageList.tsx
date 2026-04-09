import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { VList } from 'virtua';

import { MessageListItem } from './MessageListItem';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';
import LoadingMessagesIndicator from '../body/LoadingMessagesIndicator';
import RetentionPolicyWarning from '../body/RetentionPolicyWarning';
import RoomForeword from '../body/RoomForeword/RoomForeword';
import type { RetentionPolicy } from '../hooks/useRetentionPolicy';

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
	canPreview: boolean;
	hasMorePreviousMessages: boolean;
	isLoadingMoreMessages: boolean;
	user: IUser | null;
	room: IRoom;
	retentionPolicy: RetentionPolicy | undefined;
	hasMoreNextMessages: boolean;
};

export const MessageList = function MessageList({
	rid,
	messageListRef,
	canPreview,
	hasMorePreviousMessages,
	isLoadingMoreMessages,
	user,
	room,
	retentionPolicy,
	hasMoreNextMessages,
}: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const { t } = useTranslation();
	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				<VList shift style={{ height: '100%' }} aria-label={t('Message_list')} aria-busy={isLoadingMoreMessages}>
					{canPreview ? (
						<>
							{hasMorePreviousMessages ? (
								<li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li>
							) : (
								<li>
									<RoomForeword user={user} room={room} />
									{retentionPolicy?.isActive ? <RetentionPolicyWarning room={room} /> : null}
								</li>
							)}
						</>
					) : null}
					{messages.map((message, index, { [index - 1]: previous }) => {
						const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
						const showUnreadDivider = firstUnreadMessageId === message._id;
						const system = MessageTypes.isSystemMessage(message);
						const visible = !isThreadMessage(message) && !system;

						return (
							<Fragment key={message._id}>
								<MessageListItem
									message={message}
									previous={previous}
									showUnreadDivider={showUnreadDivider}
									showUserAvatar={showUserAvatar}
									sequential={sequential}
									visible={visible}
									subscription={subscription}
									system={system}
								/>
							</Fragment>
						);
					})}
					{hasMoreNextMessages ? <li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li> : null}
				</VList>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
