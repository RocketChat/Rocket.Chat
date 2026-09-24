import type { IMessage } from '@rocket.chat/core-typings';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import {
	MessageHeader as FuselageMessageHeader,
	MessageName,
	MessageTimestamp,
	MessageUsername,
	MessageStatusPrivateIndicator,
	MessageNameContainer,
} from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import StatusIndicators from './StatusIndicators';
import MessageRoles from './header/MessageRoles';
import {
	useMessageListShowUsername,
	useMessageListShowRealName,
	useMessageListShowRoles,
	useMessageListRoles,
	useMessageListFormatDateAndTime,
	useMessageListFormatTime,
	useMessageListUserCard,
	useMessageListViewer,
} from './list/MessageListContext';
import type { MessageAuthor } from './list/messageListContract';
import { normalizeUsername } from '../../../lib/utils/normalizeUsername';

export type MessageHeaderProps = {
	message: IMessage;
	author?: MessageAuthor;
};

const MessageHeader = ({ message, author = message.u }: MessageHeaderProps) => {
	const { t } = useTranslation();

	const formatTime = useMessageListFormatTime();
	const formatDateAndTime = useMessageListFormatDateAndTime();
	const { triggerProps, openUserCard } = useMessageListUserCard();
	const buttonProps = useButtonPattern((e) => openUserCard(e, message.u.username));

	const showRealName = useMessageListShowRealName();
	const user = author;
	const usernameAndRealNameAreSame = !user.name || user.username === user.name;
	const showUsername = useMessageListShowUsername() && showRealName && !usernameAndRealNameAreSame;
	const { useRealName } = useMessageListViewer();
	const displayName = getUserDisplayName(user.name, user.username, useRealName);
	const normalizedUsername = normalizeUsername(user.username);

	const showRoles = useMessageListShowRoles();
	const roles = useMessageListRoles(message.u._id);
	const shouldShowRolesList = showRoles && roles.length > 0;

	return (
		<FuselageMessageHeader>
			<MessageNameContainer
				id={`${message._id}-displayName`}
				aria-label={displayName}
				style={{ cursor: 'pointer' }}
				{...buttonProps}
				{...triggerProps}
			>
				<MessageName
					title={!showUsername && !usernameAndRealNameAreSame ? `@${normalizedUsername}` : undefined}
					data-username={normalizedUsername}
				>
					{message.alias || displayName}
				</MessageName>
				{showUsername && (
					<>
						{' '}
						<MessageUsername data-username={normalizedUsername}>@{normalizedUsername}</MessageUsername>
					</>
				)}
			</MessageNameContainer>
			{shouldShowRolesList && <MessageRoles roles={roles} isBot={!!message.bot} />}
			<MessageTimestamp id={`${message._id}-time`} title={formatDateAndTime(message.ts)}>
				{formatTime(message.ts)}
			</MessageTimestamp>
			{message.private && <MessageStatusPrivateIndicator>{t('Only_you_can_see_this_message')}</MessageStatusPrivateIndicator>}
			<StatusIndicators message={message} />
		</FuselageMessageHeader>
	);
};

export default memo(MessageHeader);
