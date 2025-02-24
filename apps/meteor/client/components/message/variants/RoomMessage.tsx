import type { IMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer, CheckBox } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useIsMessageHighlight } from '../../../views/room/MessageList/contexts/MessageHighlightContext';
import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useJumpToMessage } from '../../../views/room/MessageList/hooks/useJumpToMessage';
import { useUserCard } from '../../../views/room/contexts/UserCardContext';
import Emoji from '../../Emoji';
import IgnoredContent from '../IgnoredContent';
import MessageHeader from '../MessageHeader';
import MessageToolbarHolder from '../MessageToolbarHolder';
import StatusIndicators from '../StatusIndicators';
import RoomMessageContent from './room/RoomMessageContent';

type RoomMessageProps = {
	message: IMessage & { ignored?: boolean };
	showUserAvatar: boolean;
	sequential: boolean;
	unread: boolean;
	mention: boolean;
	all: boolean;
	context?: MessageActionContext;
	ignoredUser?: boolean;
	searchText?: string;
} & ComponentProps<typeof Message>;

const RoomMessage = ({
	message,
	showUserAvatar,
	sequential,
	all,
	mention,
	unread,
	context,
	ignoredUser,
	searchText,
	...props
}: RoomMessageProps): ReactElement => {
	const t = useTranslation();
	const uid = useUserId();
	const editing = useIsMessageHighlight(message._id);
	const [displayIgnoredMessage, toggleDisplayIgnoredMessage] = useToggle(false);
	const ignored = (ignoredUser || message.ignored) && !displayIgnoredMessage;
	const { openUserCard, triggerProps } = useUserCard();

	const selecting = useIsSelecting();
	const isOTRMessage = message.t === 'otr' || message.t === 'otr-ack';

	const toggleSelected = useToggleSelect(message._id);
	const selected = useIsSelectedMessage(message._id, isOTRMessage);

	useCountSelected();

	const messageRef = useJumpToMessage(message._id);

	return (
		<Message
			ref={messageRef}
			id={message._id}
			role='listitem'
			aria-roledescription={t('message')}
			tabIndex={0}
			aria-labelledby={`${message._id}-displayName ${message._id}-time ${message._id}-content ${message._id}-read-status`}
			onClick={selecting && !isOTRMessage ? toggleSelected : undefined}
			isSelected={selected}
			isEditing={editing}
			isPending={message.temp}
			sequential={sequential}
			data-qa-editing={editing}
			data-qa-selected={selected}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={sequential}
			data-own={message.u._id === uid}
			data-qa-type='message'
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
				{selecting && <CheckBox disabled={isOTRMessage} checked={selected} onChange={toggleSelected} />}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>
			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}
				{ignored ? (
					<IgnoredContent onShowMessageIgnored={toggleDisplayIgnoredMessage} />
				) : (
					<RoomMessageContent message={message} unread={unread} mention={mention} all={all} searchText={searchText} />
				)}
			</MessageContainer>
			{!message.private && message?.e2e !== 'pending' && !selecting && <MessageToolbarHolder message={message} context={context} />}
		</Message>
	);
};

export default memo(RoomMessage);
