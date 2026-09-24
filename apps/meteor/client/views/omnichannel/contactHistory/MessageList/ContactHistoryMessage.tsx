import type { IMessage } from '@rocket.chat/core-typings';
import { MessageName, MessageUsername, MessageTimestamp, MessageHeader as MessageHeaderTemplate } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserCard } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import ContactHistoryMessageFrame from './ContactHistoryMessageFrame';
import StatusIndicators from '../../../../components/message/StatusIndicators';
import { useFormatTime } from '../../../../hooks/useFormatTime';

export type ContactHistoryMessageProps = {
	message: IMessage;
	isNewDay: boolean;
	showUserAvatar: boolean;
};

/** A contact history message that opens a group: the author's avatar and the author and time line above its content */
const ContactHistoryMessage = ({ message, isNewDay, showUserAvatar }: ContactHistoryMessageProps) => {
	const { triggerProps, openUserCard } = useUserCard();
	const formatTime = useFormatTime();
	const displayName = useUserDisplayName(message.u);

	const avatar = message.u.username && showUserAvatar && (
		<UserAvatar
			url={message.avatar}
			username={message.u.username}
			size='x36'
			onClick={(e) => openUserCard(e, message.u.username)}
			style={{ cursor: 'pointer' }}
			role='button'
			{...triggerProps}
		/>
	);

	const header = (
		<MessageHeaderTemplate>
			<MessageName title={`@${message.u.username}`} data-username={message.u.username}>
				{message.alias || displayName}
			</MessageName>
			<MessageUsername data-username={message.u.username} data-qa-type='username'>
				@{message.u.username}
			</MessageUsername>
			<MessageTimestamp title={formatTime(message.ts)}>{formatTime(message.ts)}</MessageTimestamp>
			<StatusIndicators message={message} />
		</MessageHeaderTemplate>
	);

	return (
		<ContactHistoryMessageFrame message={message} isNewDay={isNewDay} showUserAvatar={showUserAvatar} leading={avatar} header={header} />
	);
};

export default memo(ContactHistoryMessage);
