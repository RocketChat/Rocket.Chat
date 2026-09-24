import type { IMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer, CheckBox } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, KeyboardEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import RoomMessageContent from './RoomMessageContent';
import type { MessageActionContext } from '../../../../lib/MessageAction';
import { useIsMessageHighlight } from '../../../../views/room/MessageList/contexts/MessageHighlightContext';
import { useIsSelecting, useToggleSelect, useIsSelectedMessage } from '../../../../views/room/MessageList/contexts/SelectedMessagesContext';
import IgnoredContent from '../../IgnoredContent';
import MessageToolbarHolder from '../../MessageToolbarHolder';
import { getCheckboxLabel } from '../../helpers/getCheckboxLabel';
import { useMessageListReadReceipts } from '../../list/MessageListContext';
import { useMessageListViewer } from '../../list/MessageViewerContext';
import type { MessageAuthor } from '../../list/messageListContract';

export type RoomMessageFrameProps = {
	message: IMessage & { ignored?: boolean };
	author?: MessageAuthor;
	unread: boolean;
	mention: boolean;
	all: boolean;
	context?: MessageActionContext;
	ignoredUser?: boolean;
	searchText?: string;
	/** What stands to the left of the message: the author's avatar, or the status indicators of a grouped message */
	leading: ReactNode;
	/** The author and time line; a message without one continues the group above it */
	header?: ReactNode;
} & Omit<ComponentProps<typeof Message>, 'sequential'>;

const getAriaLabelledBy = ({
	readReceiptEnabled,
	messageId,
	grouped,
}: {
	readReceiptEnabled: boolean;
	messageId: string;
	grouped: boolean;
}) => {
	const labels: string[] = [];

	if (!grouped) {
		labels.push(`${messageId}-displayName`, `${messageId}-time`);
	}

	labels.push(`${messageId}-content`);

	if (readReceiptEnabled) {
		labels.push(`${messageId}-read-status`);
	}

	return labels.join(' ');
};

/** The parts every room message shares: selection, highlighting, content and toolbar around a leading column and an optional header */
const RoomMessageFrame = ({
	message,
	author,
	all,
	mention,
	unread,
	context,
	ignoredUser,
	searchText,
	leading,
	header,
	...props
}: RoomMessageFrameProps) => {
	const { t } = useTranslation();
	const { uid } = useMessageListViewer();
	const editing = useIsMessageHighlight(message._id);
	const [displayIgnoredMessage, toggleDisplayIgnoredMessage] = useToggle(false);
	const ignored = (ignoredUser || message.ignored) && !displayIgnoredMessage;
	const grouped = !header;

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

	return (
		<Message
			id={message._id}
			role='listitem'
			tabIndex={0}
			aria-roledescription={t('message')}
			aria-labelledby={getAriaLabelledBy({ readReceiptEnabled, messageId: message._id, grouped })}
			onClick={selecting ? toggleSelected : undefined}
			onKeyDown={handleKeyDown}
			isSelected={selected}
			isEditing={editing}
			isPending={message.temp}
			sequential={grouped}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={grouped}
			data-own={message.u._id === uid}
			aria-busy={message.temp}
			{...props}
		>
			<MessageLeftContainer>
				{selecting && <CheckBox checked={selected} onChange={toggleSelected} aria-label={getCheckboxLabel(message, t)} />}
				{leading}
			</MessageLeftContainer>
			<MessageContainer>
				{header}
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

export default RoomMessageFrame;
