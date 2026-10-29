import type { IMessage } from '@rocket.chat/core-typings';
import {
	MessageSystem,
	MessageSystemContainer,
	MessageSystemLeftContainer,
	MessageSystemName,
	MessageSystemTimestamp,
	MessageSystemBlock,
	CheckBox,
	MessageNameContainer,
} from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserPresence, useUserCard } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent } from 'react';
import { memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import { useUserDisplayName } from '../../../hooks/useUserDisplayName';
import MessageContentFallback from '../MessageContentFallback';
import { useMessageDisplay } from '../contexts/MessageDisplayContext';
import { useSelectableMessage } from '../hooks/useSelectableMessage';
import { getCheckboxLabel } from '../lib/getCheckboxLabel';
import SystemMessageBody from './system/SystemMessageBody';
import SystemMessageContent from './system/SystemMessageContent';

export type SystemMessageProps = {
	message: IMessage;
} & ComponentProps<typeof MessageSystem>;

const SystemMessage = ({ message, ...props }: SystemMessageProps) => {
	const { t } = useTranslation();
	const { formatTime, formatDateAndTime, showAvatars } = useMessageDisplay();
	const { openUserCard, openUserInfo } = useUserCard();

	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const displayName = useUserDisplayName(user);

	const { isSelecting, isSelected, toggleSelected, rowProps } = useSelectableMessage(message._id);
	const buttonProps = useButtonPattern(() => openUserInfo(user.username));
	const openUserCardOnHover = (e: MouseEvent) => openUserCard(e, user.username);

	return (
		<MessageSystem
			role='listitem'
			aria-roledescription={t('system_message')}
			tabIndex={0}
			isSelected={isSelected}
			data-system-message-type={message.t}
			{...rowProps}
			{...props}
		>
			<MessageSystemLeftContainer>
				{!isSelecting && showAvatars && (
					<UserAvatar
						username={message.u.username}
						size='x18'
						title=''
						style={{ cursor: 'pointer' }}
						onMouseEnter={openUserCardOnHover}
						onClick={() => openUserInfo(user.username)}
						aria-hidden='true'
					/>
				)}
				{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} aria-label={getCheckboxLabel(message, t)} />}
			</MessageSystemLeftContainer>
			<MessageSystemContainer>
				<MessageSystemBlock>
					<MessageNameContainer
						{...(!isSelecting && {
							...buttonProps,
							style: { cursor: 'pointer' },
							onMouseEnter: openUserCardOnHover,
						})}
					>
						<MessageSystemName>{displayName}</MessageSystemName>
					</MessageNameContainer>
					<ErrorBoundary fallback={<MessageContentFallback />} resetKeys={[message]}>
						<SystemMessageBody message={message} />
					</ErrorBoundary>
					<MessageSystemTimestamp title={formatDateAndTime(message.ts)}>{formatTime(message.ts)}</MessageSystemTimestamp>
				</MessageSystemBlock>
				<ErrorBoundary fallback={<MessageContentFallback />} resetKeys={[message]}>
					<SystemMessageContent message={message} />
				</ErrorBoundary>
			</MessageSystemContainer>
		</MessageSystem>
	);
};

export default memo(SystemMessage);
