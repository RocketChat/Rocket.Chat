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
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserPresence, useUserCard } from '@rocket.chat/ui-contexts';
import type { ComponentProps, KeyboardEvent, MouseEvent } from 'react';
import { memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import MessageContentFallback from '../MessageContentFallback';
import { getCheckboxLabel } from '../helpers/getCheckboxLabel';
import { useMessageListFormatDateAndTime, useMessageListFormatTime } from '../list/MessageListContext';
import SystemMessageBody from './system/SystemMessageBody';
import SystemMessageContent from './system/SystemMessageContent';

export type SystemMessageProps = {
	message: IMessage;
	showUserAvatar: boolean;
} & ComponentProps<typeof MessageSystem>;

const SystemMessage = ({ message, showUserAvatar, ...props }: SystemMessageProps) => {
	const { t } = useTranslation();
	const formatTime = useMessageListFormatTime();
	const formatDateAndTime = useMessageListFormatDateAndTime();
	const { openUserCard, openUserInfo } = useUserCard();

	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const displayName = useUserDisplayName(user);

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();
	const buttonProps = useButtonPattern(() => openUserInfo(user.username));
	const openUserCardOnHover = (e: MouseEvent) => openUserCard(e, user.username);

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (!isSelecting) return;

		if (!(e.code === 'Space' || e.code === 'Enter')) return;

		e.preventDefault();
		toggleSelected();
	};

	const checkboxLabel = getCheckboxLabel(message, t);

	return (
		<MessageSystem
			role='listitem'
			aria-roledescription={t('system_message')}
			tabIndex={0}
			onClick={isSelecting ? toggleSelected : undefined}
			onKeyDown={handleKeyDown}
			isSelected={isSelected}
			data-system-message-type={message.t}
			{...props}
		>
			<MessageSystemLeftContainer>
				{!isSelecting && showUserAvatar && (
					<UserAvatar
						username={message.u.username}
						size='x18'
						title=''
						style={{ cursor: 'pointer' }}
						onMouseEnter={openUserCardOnHover}
						onClick={() => openUserInfo(user.username)}
						// a pointer-only shortcut for the name button next to it
						aria-hidden='true'
					/>
				)}
				{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} aria-label={checkboxLabel} />}
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
