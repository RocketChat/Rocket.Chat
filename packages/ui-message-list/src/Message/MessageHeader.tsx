import type { IMessage } from '@rocket.chat/core-typings';
import {
	MessageHeader as FuselageMessageHeader,
	MessageName,
	MessageTimestamp,
	MessageUsername,
	MessageStatusPrivateIndicator,
	MessageNameContainer,
} from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserPresence, useUserCard } from '@rocket.chat/ui-contexts';
import { memo, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import StatusIndicators from './StatusIndicators';
import { useMessageDisplay } from './contexts/MessageDisplayContext';
import { useIsSelectingMessages } from './contexts/MessageSelectionContext';
import MessageHeaderRoles from './header/MessageHeaderRoles';
import { getAuthorUsername } from './lib/getAuthorUsername';

export type MessageHeaderProps = {
	message: IMessage;
};

const MessageHeader = ({ message }: MessageHeaderProps) => {
	const { t } = useTranslation();

	const { formatTime, formatDateAndTime, showRoles, showUsername, showRealName } = useMessageDisplay();
	const { openUserCard, openUserInfo } = useUserCard();
	const buttonProps = useButtonPattern(() => openUserInfo(message.u.username));

	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const displayName = useUserDisplayName(user);
	const name = message.alias || displayName;
	const { normalizedUsername, showUsername: showAuthorUsername } = getAuthorUsername({ ...user, name }, { showUsername, showRealName });

	// While selecting, the whole row toggles the selection, so the name stops being a trigger.
	const isSelecting = useIsSelectingMessages();
	const authorTriggerProps = isSelecting
		? {}
		: {
				...buttonProps,
				onMouseEnter: (e: MouseEvent) => openUserCard(e, message.u.username),
			};

	return (
		<FuselageMessageHeader>
			<MessageNameContainer id={`${message._id}-displayName`} {...authorTriggerProps}>
				<MessageName data-username={normalizedUsername}>{name}</MessageName>
				{showAuthorUsername && (
					<>
						{' '}
						<MessageUsername data-username={normalizedUsername}>@{normalizedUsername}</MessageUsername>
					</>
				)}
			</MessageNameContainer>
			{showRoles && <MessageHeaderRoles message={message} />}
			<MessageTimestamp id={`${message._id}-time`} title={formatDateAndTime(message.ts)}>
				{formatTime(message.ts)}
			</MessageTimestamp>
			{message.private && <MessageStatusPrivateIndicator>{t('Only_you_can_see_this_message')}</MessageStatusPrivateIndicator>}
			<StatusIndicators message={message} />
		</FuselageMessageHeader>
	);
};

export default memo(MessageHeader);
