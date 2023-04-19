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
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../../hooks/useFormatTime';
import { useUserData } from '../../../hooks/useUserData';
import type { UserPresence } from '../../../lib/presence';
import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useChat } from '../../../views/room/contexts/ChatContext';
import UserAvatar from '../../avatar/UserAvatar';
import Attachments from '../content/Attachments';
import MessageActions from '../content/MessageActions';
import { useMessageListShowRealName, useMessageListShowUsername } from '../list/MessageListContext';

type SystemMessageProps = {
	message: IMessage;
	showUserAvatar: boolean;
};

const SystemMessage = ({ message, showUserAvatar }: SystemMessageProps): ReactElement => {
	const t = useTranslation();
	const formatTime = useFormatTime();
	const formatDateAndTime = useFormatDateAndTime();
	const chat = useChat();

	const showRealName = useMessageListShowRealName();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };
	const usernameAndRealNameAreSame = !user.name || user.username === user.name;
	const showUsername = useMessageListShowUsername() && showRealName && !usernameAndRealNameAreSame;

	const messageType = MessageTypes.getType(message);

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();

	return (
		<MessageSystem
			onClick={isSelecting ? toggleSelected : undefined}
			isSelected={isSelected}
			data-qa-selected={isSelected}
			data-qa='system-message'
			data-system-message-type={message.t}
		>
			<MessageSystemLeftContainer>
				{!isSelecting && showUserAvatar && <UserAvatar username={message.u.username} size='x18' />}
				{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} />}
			</MessageSystemLeftContainer>
			<MessageSystemContainer>
				<MessageSystemBlock>
					<MessageNameContainer>
						<MessageSystemName
							{...(user.username !== undefined &&
								chat?.userCard && {
									onClick: chat?.userCard.open(user.username),
									style: { cursor: 'pointer' },
								})}
						>
							{getUserDisplayName(user.name, user.username, showRealName)}
						</MessageSystemName>
						{showUsername && (
							<>
								{' '}
								<MessageUsername
									data-username={user.username}
									{...(user.username !== undefined &&
										chat?.userCard && {
											onClick: chat?.userCard.open(user.username),
											style: { cursor: 'pointer' },
										})}
								>
									@{user.username}
								</MessageUsername>
							</>
						)}
					</MessageNameContainer>
					{messageType && (
						<MessageSystemBody
							data-qa-type='system-message-body'
							dangerouslySetInnerHTML={{
								__html: messageType.render
									? messageType.render(message)
									: t(messageType.message, messageType.data ? messageType.data(message) : {}),
							}}
						/>
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
