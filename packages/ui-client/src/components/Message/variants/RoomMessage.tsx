import type { IMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer, CheckBox } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import IgnoredContent from '../IgnoredContent';
import MessageAuthorAvatar from '../MessageAuthorAvatar';
import MessageContentFallback from '../MessageContentFallback';
import MessageHeader from '../MessageHeader';
import StatusIndicators from '../StatusIndicators';
import type { MessageActionContext } from '../contexts/MessageAction';
import { useMessageDisplay } from '../contexts/MessageDisplayContext';
import { useIsMessageEmphasized } from '../hooks/useIsMessageEmphasized';
import { useSelectableMessage } from '../hooks/useSelectableMessage';
import { getCheckboxLabel } from '../lib/getCheckboxLabel';
import RoomMessageContent from './room/RoomMessageContent';

export type RoomMessageProps = {
	message: IMessage & { ignored?: boolean };
	sequential: boolean;
	/** The thread of this message has replies the viewer has not read, mentions them, or mentions everyone. */
	unread: boolean;
	mention: boolean;
	all: boolean;
	context?: MessageActionContext;
	ignoredUser?: boolean;
	searchText?: string;
} & Omit<ComponentProps<typeof Message>, 'content'>;

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
	sequential,
	all,
	mention,
	unread,
	context: _context,
	ignoredUser,
	searchText,
	...props
}: RoomMessageProps) => {
	const { t } = useTranslation();
	const uid = useUserId();
	const { showAvatars, readReceipts } = useMessageDisplay();
	const isEmphasized = useIsMessageEmphasized(message._id);
	const [displayIgnoredMessage, toggleDisplayIgnoredMessage] = useToggle(false);
	const ignored = (ignoredUser || message.ignored) && !displayIgnoredMessage;
	const { isSelecting, isSelected, toggleSelected, rowProps } = useSelectableMessage(message._id);

	return (
		<Message
			id={message._id}
			role='listitem'
			tabIndex={0}
			aria-roledescription={t('message')}
			aria-labelledby={getAriaLabelledBy({ readReceiptEnabled: readReceipts.enabled, messageId: message._id, sequential })}
			isSelected={isSelected}
			isEditing={isEmphasized}
			isPending={message.temp}
			sequential={sequential}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={sequential}
			data-own={message.u._id === uid}
			aria-busy={message.temp}
			{...rowProps}
			{...props}
		>
			<MessageLeftContainer>
				{!sequential && message.u.username && !isSelecting && showAvatars && <MessageAuthorAvatar message={message} />}
				{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} aria-label={getCheckboxLabel(message, t)} />}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>
			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}
				{ignored ? (
					<IgnoredContent messageId={message._id} onShowMessageIgnored={toggleDisplayIgnoredMessage} />
				) : (
					<ErrorBoundary fallback={<MessageContentFallback id={`${message._id}-content`} />} resetKeys={[message]}>
						<RoomMessageContent message={message} unread={unread} mention={mention} all={all} searchText={searchText} />
					</ErrorBoundary>
				)}
			</MessageContainer>
		</Message>
	);
};

export default memo(RoomMessage);
