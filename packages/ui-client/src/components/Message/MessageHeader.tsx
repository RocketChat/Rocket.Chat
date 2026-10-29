import type { IMessage } from '@rocket.chat/core-typings';
import {
	MessageHeader as FuselageMessageHeader,
	MessageName,
	MessageTimestamp,
	MessageStatusPrivateIndicator,
	MessageNameContainer,
} from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useUserPresence, useUserCard } from '@rocket.chat/ui-contexts';
import { memo, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import StatusIndicators from './StatusIndicators';
import { useMessageDisplay } from './contexts/MessageDisplayContext';
import { useMessageRelatedData } from './contexts/MessageRelatedDataContext';
import { useIsSelectingMessages } from './contexts/MessageSelectionContext';
import MessageRoles from './header/MessageRoles';
import { normalizeUsername } from './lib/normalizeUsername';
import { useUserDisplayName } from '../../hooks/useUserDisplayName';

export type MessageHeaderProps = {
	message: IMessage;
};

const MessageHeader = ({ message }: MessageHeaderProps) => {
	const { t } = useTranslation();

	const { formatTime, formatDateAndTime, showRoles } = useMessageDisplay();
	const { useUserRoles } = useMessageRelatedData();
	const { openUserCard, openUserInfo } = useUserCard();
	const buttonProps = useButtonPattern(() => openUserInfo(message.u.username));

	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const displayName = useUserDisplayName(user);
	const normalizedUsername = normalizeUsername(user.username);

	const { workspaceRoles, roomRoles } = useUserRoles(message.u._id, message.rid, { enabled: showRoles });
	const shouldShowRolesList = showRoles && (workspaceRoles.length > 0 || roomRoles.length > 0 || !!message.bot);

	// While selecting, the whole row toggles the selection, so the name and the role tag stop being triggers.
	const isSelecting = useIsSelectingMessages();
	const authorTriggerProps = isSelecting
		? {}
		: {
				...buttonProps,
				style: { cursor: 'pointer' },
				onMouseEnter: (e: MouseEvent) => openUserCard(e, message.u.username),
			};

	return (
		<FuselageMessageHeader>
			<MessageNameContainer id={`${message._id}-displayName`} {...authorTriggerProps}>
				<MessageName data-username={normalizedUsername}>{message.alias || displayName}</MessageName>
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
