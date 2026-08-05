import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import {
	Box,
	MessageHeader as FuselageMessageHeader,
	MessageName,
	MessageTimestamp,
	MessageStatusPrivateIndicator,
	MessageNameContainer,
	Palette,
} from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserPresence, useUserCard } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import StatusIndicators from './StatusIndicators';
import MessageRoles from './header/MessageRoles';
import {
	useMessageListShowRoles,
	useMessageListFormatDateAndTime,
	useMessageListFormatTime,
	useMessageListHoverUserCardEnabled,
} from './list/MessageListContext';
import { normalizeUsername } from '../../../lib/utils/normalizeUsername';
import { useUserRolesByScope } from '../../hooks/useUserRolesByScope';

const nameStyle = css`
	/* The underline is painted with the wrapper's color, so it must match
	   the name's color token to not look washed out. */
	color: ${Palette.text['font-titles-labels']};

	&:hover {
		text-decoration: underline;
	}

	& .rcx-message-header__name {
		color: ${Palette.text['font-titles-labels']};
	}
`;

const timestampStyle = css`
	& .rcx-message-header__time {
		color: ${Palette.text['font-secondary-info']};
	}

	/* secondary-info clears the 4.5:1 contrast requirement on the room
	   surface (4.80:1) but not on the hover surface (4.33:1), so it steps up
	   to the default token while hovered. Mirrors the rule added to the
	   design system in fuselage#2138; both this block and the wrapper
	   applying it can drop once that lands and the package is bumped. */
	.rcx-message:hover & .rcx-message-header__time {
		color: ${Palette.text['font-default']};
	}
`;

export type MessageHeaderProps = {
	message: IMessage;
};

const MessageHeader = ({ message }: MessageHeaderProps) => {
	const { t } = useTranslation();

	const formatTime = useMessageListFormatTime();
	const formatDateAndTime = useMessageListFormatDateAndTime();
	const { triggerProps, openUserCard, openUserInfo } = useUserCard();
	const hoverUserCardEnabled = useMessageListHoverUserCardEnabled();

	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const displayName = useUserDisplayName(user);
	const normalizedUsername = normalizeUsername(user.username);

	const showRoles = useMessageListShowRoles();
	const { workspaceRoles, roomRoles } = useUserRolesByScope(message.u._id, message.rid, showRoles);
	const shouldShowRolesList = showRoles && (workspaceRoles.length > 0 || roomRoles.length > 0 || !!message.bot);

	return (
		<FuselageMessageHeader>
			<MessageNameContainer
				id={`${message._id}-displayName`}
				aria-label={displayName}
				role='button'
				tabIndex={0}
				aria-haspopup='dialog'
				style={{ cursor: 'pointer' }}
				onMouseEnter={hoverUserCardEnabled ? (e) => openUserCard(e, message.u.username) : undefined}
				onClick={() => openUserInfo(message.u.username)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						openUserInfo(message.u.username);
					}
				}}
				{...triggerProps}
			>
				<Box is='span' className={nameStyle}>
					<MessageName data-username={normalizedUsername}>{message.alias || displayName}</MessageName>
				</Box>
			</MessageNameContainer>
			{shouldShowRolesList && (
				<MessageRoles
					workspaceRoles={workspaceRoles}
					roomRoles={roomRoles}
					isBot={!!message.bot}
					onClick={(e) => openUserCard(e, message.u.username)}
				/>
			)}
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
