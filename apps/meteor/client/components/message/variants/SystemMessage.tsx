import type { IMessage } from '@rocket.chat/core-typings';
import {
	MessageSystem,
	MessageSystemBody,
	MessageSystemContainer,
	MessageSystemLeftContainer,
	MessageSystemName,
	MessageSystemTimestamp,
	MessageSystemBlock,
	CheckBox,
	MessageUsername,
	MessageNameContainer,
} from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageTypes } from '../../../../app/ui-utils/client';
import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useUserCard } from '../../../views/room/contexts/UserCardContext';
import Attachments from '../content/Attachments';
import MessageActions from '../content/MessageActions';
import {
	useMessageListShowRealName,
	useMessageListShowUsername,
	useMessageListFormatDateAndTime,
	useMessageListFormatTime,
} from '../list/MessageListContext';
import { Users } from '../../../stores/Users';

type SystemMessageProps = {
	message: IMessage;
	showUserAvatar: boolean;
} & ComponentProps<typeof MessageSystem>;

const SystemMessage = ({ message, showUserAvatar, ...props }: SystemMessageProps): ReactElement => {
	const { t } = useTranslation();
	const formatTime = useMessageListFormatTime();
	const formatDateAndTime = useMessageListFormatDateAndTime();
	const { triggerProps, openUserCard } = useUserCard();

	const showRealName = useMessageListShowRealName();
	const user = { ...message.u, roles: [], ...useUserPresence(message.u._id) };
	const usernameAndRealNameAreSame = !user.name || user.username === user.name;
	const showUsername = useMessageListShowUsername() && showRealName && !usernameAndRealNameAreSame;
	const displayName = useUserDisplayName(user);

	const messageType = MessageTypes.getType(message);

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();
	const buttonProps = useButtonPattern((e) => openUserCard(e, user.username));

	return (
		<MessageSystem
			role='listitem'
			aria-roledescription={t('system_message')}
			tabIndex={0}
			onClick={isSelecting ? toggleSelected : undefined}
			isSelected={isSelected}
			data-qa-selected={isSelected}
			data-qa='system-message'
			data-system-message-type={message.t}
			{...props}
		>
			<MessageSystemLeftContainer>
				{!isSelecting && showUserAvatar && (() => {
					const user = Users.state.find((u) => u.username === message.u.username);
					const etag = user?.avatarETag;
					return <UserAvatar username={message.u.username} etag={etag} size='x18' />;
				})()}
				{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} />}
			</MessageSystemLeftContainer>
			<MessageSystemContainer>
				<MessageSystemBlock>
					<MessageNameContainer style={{ cursor: 'pointer' }} {...buttonProps} {...triggerProps}>
						<MessageSystemName>{displayName}</MessageSystemName>
						{showUsername && (
							<>
								{' '}
								<MessageUsername data-username={user.username}>@{user.username}</MessageUsername>
							</>
						)}
					</MessageNameContainer>
					{messageType && (
						<MessageSystemBody data-qa-type='system-message-body'>
							{t(messageType.message, messageType.data ? messageType.data(message) : {})}
						</MessageSystemBody>
					)}
					<MessageSystemTimestamp title={formatDateAndTime(message.ts)}>{formatTime(message.ts)}</MessageSystemTimestamp>
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
