import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import {
	Box,
	MessageSystem,
	MessageSystemBody,
	MessageSystemContainer,
	MessageSystemLeftContainer,
	MessageSystemName,
	MessageSystemTimestamp,
	MessageSystemBlock,
	CheckBox,
	MessageNameContainer,
	Palette,
} from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPresence, useUserCard } from '@rocket.chat/ui-contexts';
import type { ComponentProps, KeyboardEvent } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import Attachments from '../content/Attachments';
import MessageActions from '../content/MessageActions';
import { getCheckboxLabel } from '../helpers/getCheckboxLabel';
import { useMessageListFormatDateAndTime, useMessageListFormatTime } from '../list/MessageListContext';

const hoverUnderlineStyle = css`
	&:hover {
		text-decoration: underline;
	}

	& .rcx-message-system__name {
		color: ${Palette.text['font-titles-labels']};
	}
`;

const timestampStyle = css`
	& .rcx-message-system__time {
		font-size: 0.625rem;
		color: ${Palette.text['font-secondary-info']};
	}
`;

export type SystemMessageProps = {
	message: IMessage;
	showUserAvatar: boolean;
} & ComponentProps<typeof MessageSystem>;

const SystemMessage = ({ message, showUserAvatar, ...props }: SystemMessageProps) => {
	const { t } = useTranslation();
	const formatTime = useMessageListFormatTime();
	const formatDateAndTime = useMessageListFormatDateAndTime();
	const { triggerProps, openUserCard, openUserInfo } = useUserCard();

	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const displayName = useUserDisplayName(user);

	const messageType = MessageTypes.getType(message);

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();

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
				{!isSelecting && showUserAvatar && <UserAvatar username={message.u.username} size='x18' />}
				{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} aria-label={checkboxLabel} />}
			</MessageSystemLeftContainer>
			<MessageSystemContainer>
				<MessageSystemBlock>
					<MessageNameContainer
						role='button'
						tabIndex={0}
						aria-haspopup='dialog'
						style={{ cursor: 'pointer' }}
						onMouseEnter={(e) => openUserCard(e, user.username)}
						onClick={() => openUserInfo(user.username)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								openUserInfo(user.username);
							}
						}}
						{...triggerProps}
					>
						<Box is='span' className={hoverUnderlineStyle}>
							<MessageSystemName>{displayName}</MessageSystemName>
						</Box>
					</MessageNameContainer>
					{messageType && (
						<MessageSystemBody role='document' aria-roledescription={t('system_message_body')}>
							{messageType.text(t, message)}
						</MessageSystemBody>
					)}
					<Box is='span' className={timestampStyle}>
						<MessageSystemTimestamp title={formatDateAndTime(message.ts)}>{formatTime(message.ts)}</MessageSystemTimestamp>
					</Box>
				</MessageSystemBlock>
				{message.attachments && (
					<MessageSystemBlock>
						<Attachments attachments={message.attachments} />
					</MessageSystemBlock>
				)}
				{message.actionLinks?.length && (
					<MessageActions
						message={message}
						actions={message.actionLinks.map(({ method_id: methodId, i18nLabel, ...action }) => ({
							methodId,
							i18nLabel: i18nLabel as TranslationKey,
							...action,
						}))}
					/>
				)}
			</MessageSystemContainer>
		</MessageSystem>
	);
};

export default memo(SystemMessage);
