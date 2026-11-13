import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useMergedRefsV2 } from '@rocket.chat/ui-client';
import type { MessageListHandle, MessageListMessageRow, MessageListVisibility } from '@rocket.chat/ui-message-list';
import {
	MessageList,
	MessageListDateBubble,
	MessageListJumpToLatestButton,
	MessageListNewMessagesButton,
} from '@rocket.chat/ui-message-list';
import type { Ref } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import RoomMessageRow from './RoomMessageRow';
import { useRoomMessageListData } from './useRoomMessageListData';
import { useScrollToBottomOnOwnMessage } from './useScrollToBottomOnOwnMessage';
import { MessagesProvider } from '../../../../providers/MessagesProvider';
import { MessageMarkers } from '../../../../providers/MessagesProvider/MessageMarkers';
import { roomMessageSelection } from '../../../../providers/MessagesProvider/messageSelectionFromStore';
import { useChat } from '../../contexts/ChatContext';
import type { RetentionPolicy } from '../../hooks/useRetentionPolicy';
import RetentionPolicyWarning from '../RetentionPolicyWarning';
import RoomForeword from '../RoomForeword/RoomForeword';

/** How far from the end of the latest messages the viewer still counts as being at the bottom, in pixels. */
const BOTTOM_THRESHOLD = 60;

/** The space the room keeps above its first row and below its last one, in pixels; more below while newer messages remain. */
const START_SPACING = 21;
const END_SPACING = 10;
const END_SPACING_WHILE_NEWER_MESSAGES_REMAIN = 34;

export type RoomMessageListProps = {
	ref?: Ref<MessageListHandle>;
	room: IRoom;
	subscription: ISubscription | undefined;
	user: IUser | null;
	canPreview: boolean;
	retentionPolicy: RetentionPolicy | undefined;
	/** The height of what the room draws over the top of the list, in pixels. */
	overlayTopInset?: number;
	onVisibleMessagesChange: (visibility: MessageListVisibility) => void;
};

const renderMessage = ({ message, isSequential, startsNewDay, isFirstUnread }: MessageListMessageRow<IMessage>) => (
	<RoomMessageRow message={message} isSequential={isSequential} startsNewDay={startsNewDay} isFirstUnread={isFirstUnread} />
);

/** The messages of the opened room. */
const RoomMessageList = ({
	ref,
	room,
	subscription,
	user,
	canPreview,
	retentionPolicy,
	overlayTopInset,
	onVisibleMessagesChange,
}: RoomMessageListProps) => {
	const { t } = useTranslation();
	const chat = useChat();
	const { hasOlderMessages, ...data } = useRoomMessageListData(room._id);
	const listRef = useRef<MessageListHandle>(null);
	const mergedRef = useMergedRefsV2(ref, listRef);
	useScrollToBottomOnOwnMessage(room._id, listRef);

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

	const focusComposer = useCallback(() => chat?.composer?.focus(), [chat]);

	return (
		<MessagesProvider room={room} subscription={subscription} selection={roomMessageSelection}>
			<MessageMarkers subscription={subscription}>
				<MessageList<IMessage>
					ref={mergedRef}
					aria-label={t('Message_list')}
					{...data}
					bottomThreshold={BOTTOM_THRESHOLD}
					startSpacing={START_SPACING}
					endSpacing={data.hasNewerMessages ? END_SPACING_WHILE_NEWER_MESSAGES_REMAIN : END_SPACING}
					overlayTopInset={overlayTopInset}
					deferPagingUntilInput
					hasOlderMessages={canPreview && hasOlderMessages}
					header={header}
					onVisibleMessagesChange={onVisibleMessagesChange}
					renderMessage={renderMessage}
				>
					<MessageListDateBubble />
					<MessageListNewMessagesButton onClick={focusComposer} />
					<MessageListJumpToLatestButton />
				</MessageList>
			</MessageMarkers>
		</MessagesProvider>
	);
};

export default RoomMessageList;
