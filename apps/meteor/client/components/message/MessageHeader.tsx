import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import {
	Box,
	MessageHeader as FuselageMessageHeader,
	MessageName,
	MessageTimestamp,
	MessageUsername,
	MessageStatusPrivateIndicator,
	MessageNameContainer,
	Palette,
} from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserPresence, useUserCard, useUserPreference } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import StatusIndicators from './StatusIndicators';
import MessageRoles from './header/MessageRoles';
import { useMessageRoles } from './header/hooks/useMessageRoles';
import {
	useMessageListShowUsername,
	useMessageListShowRealName,
	useMessageListShowRoles,
	useMessageListFormatDateAndTime,
	useMessageListFormatTime,
} from './list/MessageListContext';
import { normalizeUsername } from '../../../lib/utils/normalizeUsername';

const nameStyle = css`
	&:hover {
		text-decoration: underline;
	}

	& .rcx-message-header__name {
		color: ${Palette.text['font-titles-labels']};
	}
`;

const timestampStyle = css`
	& .rcx-message-header__time {
		font-size: 0.625rem;
		color: ${Palette.text['font-secondary-info']};
	}
`;

export type MessageHeaderProps = {
	message: IMessage;
};

const MessageHeader = ({ message }: MessageHeaderProps) => {
	const { t } = useTranslation();

	const formatTime = useMessageListFormatTime();
	const formatDateAndTime = useMessageListFormatDateAndTime();
	const { triggerProps, openUserCard } = useUserCard();

	const showRealName = useMessageListShowRealName();
	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const usernameAndRealNameAreSame = !user.name || user.username === user.name;
	const showUsername = useMessageListShowUsername() && showRealName && !usernameAndRealNameAreSame;
	const displayName = useUserDisplayName(user);
	const normalizedUsername = normalizeUsername(user.username);
	const mentionsWithSymbol = useUserPreference<boolean>('mentionsWithSymbol');
	const usernameTooltip = mentionsWithSymbol ? `@${normalizedUsername}` : normalizedUsername;

	const showRoles = useMessageListShowRoles();
	const roles = useMessageRoles(message.u._id, message.rid, showRoles);
	const shouldShowRolesList = showRoles && roles.length > 0;

	return (
		<FuselageMessageHeader>
			<MessageNameContainer
				id={`${message._id}-displayName`}
				aria-label={displayName}
				role='button'
				tabIndex={0}
				aria-haspopup='dialog'
				style={{ cursor: 'pointer' }}
				onMouseEnter={(e) => openUserCard(e, message.u.username)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						openUserCard(e, message.u.username);
					}
				}}
				{...triggerProps}
			>
				<Box is='span' className={nameStyle}>
					<MessageName
						title={!showUsername && !usernameAndRealNameAreSame ? usernameTooltip : undefined}
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
				</Box>
			</MessageNameContainer>
			{shouldShowRolesList && <MessageRoles roles={roles} isBot={!!message.bot} onClick={(e) => openUserCard(e, message.u.username)} />}
			<Box is='span' className={timestampStyle}>
				<MessageTimestamp id={`${message._id}-time`} title={formatDateAndTime(message.ts)}>
					{formatTime(message.ts)}
				</MessageTimestamp>
			</Box>
			{message.private && <MessageStatusPrivateIndicator>{t('Only_you_can_see_this_message')}</MessageStatusPrivateIndicator>}
			<StatusIndicators message={message} />
		</FuselageMessageHeader>
	);
};

export default memo(MessageHeader);
