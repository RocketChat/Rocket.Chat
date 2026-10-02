import type { IMessage } from '@rocket.chat/core-typings';
import {
	MessageHeader as FuselageMessageHeader,
	MessageName,
	MessageTimestamp,
	MessageStatusPrivateIndicator,
	MessageNameContainer,
} from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserPresence, useUserCard } from '@rocket.chat/ui-contexts';
import { memo, type MouseEvent } from 'react';
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
import { useIsSelecting } from '../../views/room/MessageList/contexts/SelectedMessagesContext';

export type MessageHeaderProps = {
	message: IMessage;
};

const MessageHeader = ({ message }: MessageHeaderProps) => {
	const { t } = useTranslation();

	const formatTime = useMessageListFormatTime();
	const formatDateAndTime = useMessageListFormatDateAndTime();
	const { triggerProps, openUserCard, openUserInfo } = useUserCard();
	const hoverUserCardEnabled = useMessageListHoverUserCardEnabled();
	// Enter/Space opens the card (focused, so its actions are reachable); a click opens the full profile.
	const buttonProps = useButtonPattern((e) =>
		e.type === 'keydown' ? openUserCard(e, message.u.username) : openUserInfo(message.u.username),
	);

	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const displayName = useUserDisplayName(user);
	const normalizedUsername = normalizeUsername(user.username);

	const showRoles = useMessageListShowRoles();
	const { workspaceRoles, roomRoles } = useUserRolesByScope(message.u._id, message.rid, showRoles);
	const shouldShowRolesList = showRoles && (workspaceRoles.length > 0 || roomRoles.length > 0 || !!message.bot);

	// While selecting, the whole row toggles the selection, so the name and the role tag stop being triggers.
	const isSelecting = useIsSelecting();
	const authorTriggerProps = isSelecting
		? {}
		: {
				...buttonProps,
				style: { cursor: 'pointer' },
				...(hoverUserCardEnabled && { onMouseEnter: (e: MouseEvent) => openUserCard(e, message.u.username) }),
				...triggerProps,
			};

	return (
		<FuselageMessageHeader>
			<MessageNameContainer id={`${message._id}-displayName`} {...authorTriggerProps}>
				<MessageName
					title={!hoverUserCardEnabled && displayName !== normalizedUsername ? `@${normalizedUsername}` : undefined}
					data-username={normalizedUsername}
				>
					{message.alias || displayName}
				</MessageName>
			</MessageNameContainer>
			{shouldShowRolesList && (
				<MessageRoles
					workspaceRoles={workspaceRoles}
					roomRoles={roomRoles}
					isBot={!!message.bot}
					onClick={isSelecting ? undefined : (e) => openUserCard(e, message.u.username)}
				/>
			)}
			<MessageTimestamp id={`${message._id}-time`} title={formatDateAndTime(message.ts)}>
				{formatTime(message.ts)}
			</MessageTimestamp>
			{message.private && <MessageStatusPrivateIndicator>{t('Only_you_can_see_this_message')}</MessageStatusPrivateIndicator>}
			<StatusIndicators message={message} />
		</FuselageMessageHeader>
	);
};

export default memo(MessageHeader);
