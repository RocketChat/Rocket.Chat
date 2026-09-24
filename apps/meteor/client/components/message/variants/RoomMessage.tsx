import type { IMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer, CheckBox } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, KeyboardEvent } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageActionContext } from '../../../lib/MessageAction';
import { useIsMessageHighlight } from '../../../views/room/MessageList/contexts/MessageHighlightContext';
import { useIsSelecting, useToggleSelect, useIsSelectedMessage } from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import Emoji from '../../Emoji';
import IgnoredContent from '../IgnoredContent';
import MessageHeader from '../MessageHeader';
import MessageToolbarHolder from '../MessageToolbarHolder';
import StatusIndicators from '../StatusIndicators';
import RoomMessageContent from './room/RoomMessageContent';
import { getCheckboxLabel } from '../helpers/getCheckboxLabel';
import { useMessageListReadReceipts, useMessageListUserCard, useMessageListViewer } from '../list/MessageListContext';
import type { MessageAuthor } from '../list/messageListContract';

export type RoomMessageProps = {
	message: IMessage & { ignored?: boolean };
	author?: MessageAuthor;
	showUserAvatar: boolean;
	sequential: boolean;
	unread: boolean;
	mention: boolean;
	all: boolean;
	context?: MessageActionContext;
	ignoredUser?: boolean;
	searchText?: string;
} & ComponentProps<typeof Message>;

const getAriaLabelledBy = ({
	readReceiptEnabled,
	messageId,
	sequential,
}: {
	readReceiptEnabled: boolean;
	messageId: string;
	sequential: boolean;
}) => {
	const labels: string[] = [];

	if (!sequential) {
		labels.push(`${messageId}-displayName`, `${messageId}-time`);
	}

	labels.push(`${messageId}-content`);

	if (readReceiptEnabled) {
		labels.push(`${messageId}-read-status`);
	}

	return labels.join(' ');
};

const RoomMessage = ({
	message,
	author,
	showUserAvatar,
	sequential,
	all,
	mention,
	unread,
	context,
	ignoredUser,
	searchText,
	...props
}: RoomMessageProps) => {
	const { t } = useTranslation();
	const { uid } = useMessageListViewer();
	const editing = useIsMessageHighlight(message._id);
	const [displayIgnoredMessage, toggleDisplayIgnoredMessage] = useToggle(false);
	const ignored = (ignoredUser || message.ignored) && !displayIgnoredMessage;
	const { openUserCard, triggerProps } = useMessageListUserCard();

	const selecting = useIsSelecting();

	const toggleSelected = useToggleSelect(message._id);
	const selected = useIsSelectedMessage(message._id);

	const { enabled: readReceiptEnabled } = useMessageListReadReceipts();

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (!selecting) return;

		if (!(e.code === 'Space' || e.code === 'Enter')) return;

		e.preventDefault();
		toggleSelected();
	};

	const checkboxLabel = getCheckboxLabel(message, t);

	return (
		<Message
			id={message._id}
			role='listitem'
			tabIndex={0}
			aria-roledescription={t('message')}
			aria-labelledby={getAriaLabelledBy({ readReceiptEnabled, messageId: message._id, sequential })}
			onClick={selecting ? toggleSelected : undefined}
			onKeyDown={handleKeyDown}
			isSelected={selected}
			isEditing={editing}
			isPending={message.temp}
			sequential={sequential}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={sequential}
			data-own={message.u._id === uid}
			aria-busy={message.temp}
			{...props}
		>
			<MessageLeftContainer>
				{!sequential && message.u.username && !selecting && showUserAvatar && (
					<MessageAvatar
						emoji={message.emoji ? <Emoji emojiHandle={message.emoji} fillContainer /> : undefined}
						avatarUrl={message.avatar}
						username={message.u.username}
						size='x36'
						onClick={(e) => openUserCard(e, message.u.username)}
						style={{ cursor: 'pointer' }}
						role='button'
						{...triggerProps}
					/>
				)}
				{selecting && <CheckBox checked={selected} onChange={toggleSelected} aria-label={checkboxLabel} />}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>
			<MessageContainer>
				{!sequential && <MessageHeader message={message} author={author} />}
				{ignored ? (
					<IgnoredContent messageId={message._id} onShowMessageIgnored={toggleDisplayIgnoredMessage} />
				) : (
					<RoomMessageContent message={message} author={author} unread={unread} mention={mention} all={all} searchText={searchText} />
				)}
			</MessageContainer>
			{!message.private && message?.e2e !== 'pending' && !selecting && <MessageToolbarHolder message={message} context={context} />}
		</Message>
	);
};

export default memo(RoomMessage);
