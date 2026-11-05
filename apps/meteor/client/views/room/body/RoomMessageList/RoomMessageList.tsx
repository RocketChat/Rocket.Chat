import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import type { MessageListHandle, MessageListVisibility } from '@rocket.chat/ui-client';
import { MessageList, MessageListDateBubble, MessageListJumpToLatestButton, MessageListNewMessagesButton } from '@rocket.chat/ui-client';
import type { Ref } from 'react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomMessageRow from './RoomMessageRow';
import { useRoomMessageListData } from './useRoomMessageListData';
import { MessagesProvider, messageSelectionFromStore } from '../../../../providers/MessagesProvider';
import { useChat } from '../../contexts/ChatContext';
import type { RetentionPolicy } from '../../hooks/useRetentionPolicy';
import { selectedMessageStore } from '../../providers/SelectedMessageStore';
import RetentionPolicyWarning from '../RetentionPolicyWarning';
import RoomForeword from '../RoomForeword/RoomForeword';

const selection = messageSelectionFromStore(selectedMessageStore);

const isSelectable = (message: IMessage) => !isThreadMessage(message);

export type RoomMessageListProps = {
	ref?: Ref<MessageListHandle>;
	room: IRoom;
	subscription: ISubscription | undefined;
	user: IUser | null;
	canPreview: boolean;
	retentionPolicy: RetentionPolicy | undefined;
	onVisibleMessagesChange: (visibility: MessageListVisibility) => void;
};

/** The messages of the opened room. */
const RoomMessageList = ({ ref, room, subscription, user, canPreview, retentionPolicy, onVisibleMessagesChange }: RoomMessageListProps) => {
	const { t } = useTranslation();
	const chat = useChat();
	const { hasOlderMessages, ...data } = useRoomMessageListData(room._id);

	useEffect(() => {
		selectedMessageStore.setAvailableMessages(data.messages.filter(isSelectable).map(({ _id }) => _id));
	}, [data.messages]);

	const header = useMemo(
		() =>
			canPreview ? (
				<>
					<RoomForeword user={user} room={room} />
					{retentionPolicy?.isActive ? <RetentionPolicyWarning room={room} /> : null}
				</>
			) : undefined,
		[canPreview, user, room, retentionPolicy?.isActive],
	);

	return (
		<MessagesProvider room={room} subscription={subscription} selection={selection}>
			<MessageList<IMessage>
				ref={ref}
				aria-label={t('Message_list')}
				{...data}
				hasOlderMessages={canPreview && hasOlderMessages}
				header={header}
				onVisibleMessagesChange={onVisibleMessagesChange}
				renderMessage={(row) => <RoomMessageRow row={row} subscription={subscription} />}
			>
				<MessageListDateBubble />
				<MessageListNewMessagesButton onClick={() => chat?.composer?.focus()} />
				<MessageListJumpToLatestButton />
			</MessageList>
		</MessagesProvider>
	);
};

export default RoomMessageList;
