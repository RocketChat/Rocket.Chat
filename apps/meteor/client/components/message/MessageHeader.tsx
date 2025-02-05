import type { IMessage } from '@rocket.chat/core-typings';
import {
	MessageHeader as FuselageMessageHeader,
	MessageName,
	MessageTimestamp,
	MessageUsername,
	MessageStatusPrivateIndicator,
	MessageNameContainer,
} from '@rocket.chat/fuselage';
import type { KeyboardEvent, ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import StatusIndicators from './StatusIndicators';
import MessageRoles from './header/MessageRoles';
import { useMessageListShowUsername, useMessageListShowRealName, useMessageListShowRoles } from './list/MessageListContext';
import { getUserDisplayName } from '../../../lib/getUserDisplayName';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../hooks/useFormatTime';
import { useUserData } from '../../hooks/useUserData';
import type { UserPresence } from '../../lib/presence';
import { useMessageRoles } from './header/hooks/useMessageRoles';
import { useUserCard } from '../../views/room/contexts/UserCardContext';

type MessageHeaderProps = {
	message: IMessage;
};

const MessageHeader = ({ message }: MessageHeaderProps): ReactElement => {
	const { t } = useTranslation();

	const formatTime = useFormatTime();
	const formatDateAndTime = useFormatDateAndTime();
	const { triggerProps, openUserCard } = useUserCard();

	const showRealName = useMessageListShowRealName();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };
	const usernameAndRealNameAreSame = !user.name || user.username === user.name;
	const showUsername = useMessageListShowUsername() && showRealName && !usernameAndRealNameAreSame;

	const showRoles = useMessageListShowRoles();
	const roles = useMessageRoles(message.u._id, message.rid, showRoles);
	const shouldShowRolesList = roles.length > 0;

	return (
		<FuselageMessageHeader>
			<MessageNameContainer
				tabIndex={0}
				role='button'
				id={`${message._id}-displayName`}
				aria-label={getUserDisplayName(user.name, user.username, showRealName)}
				onClick={(e) => openUserCard(e, message.u.username)}
				onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
					(e.code === 'Enter' || e.code === 'Space') && openUserCard(e, message.u.username);
				}}
				style={{ cursor: 'pointer' }}
				{...triggerProps}
			>
				<MessageName
					{...(!showUsername && { 'data-qa-type': 'username' })}
					title={!showUsername && !usernameAndRealNameAreSame ? `@${user.username}` : undefined}
					data-username={user.username}
				>
					{message.alias || getUserDisplayName(user.name, user.username, showRealName)}
				</MessageName>
				{showUsername && (
					<>
						{' '}
						<MessageUsername data-username={user.username} data-qa-type='username'>
							@{user.username}
						</MessageUsername>
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
