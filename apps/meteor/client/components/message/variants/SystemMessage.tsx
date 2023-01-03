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
import { useUserData } from '../../../hooks/useUserData';
import { getUserDisplayName } from '../../../lib/getUserDisplayName';
import type { UserPresence } from '../../../lib/presence';
import { useMessageListShowRealName, useMessageListShowUsername } from '../../../views/room/MessageList/contexts/MessageListContext';
import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useMessageActions, useMessageRunActionLink } from '../../../views/room/contexts/MessageContext';
import UserAvatar from '../../avatar/UserAvatar';
import Attachments from '../content/Attachments';
import MessageActions from '../content/MessageActions';

type SystemMessageProps = {
	message: IMessage;
};

const SystemMessage = ({ message }: SystemMessageProps): ReactElement => {
	const t = useTranslation();
	const {
		actions: { openUserCard },
		formatters,
	} = useMessageActions();
	const runActionLink = useMessageRunActionLink();
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
				{!isSelecting && <UserAvatar username={message.u.username} size='x18' />}
				{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} />}
			</MessageSystemLeftContainer>
			<MessageSystemContainer>
				<MessageSystemBlock>
					<MessageNameContainer>
						<MessageSystemName
							onClick={user.username !== undefined ? openUserCard(user.username) : undefined}
							style={{ cursor: 'pointer' }}
						>
							{getUserDisplayName(user.name, user.username, showRealName)}
						</MessageSystemName>
						{showUsername && (
							<>
								{' '}
								<MessageUsername
									data-username={user.username}
									onClick={user.username !== undefined ? openUserCard(user.username) : undefined}
									style={{ cursor: 'pointer' }}
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
					<MessageSystemTimestamp title={formatters.dateAndTime(message.ts)}>{formatters.time(message.ts)}</MessageSystemTimestamp>
				</MessageSystemBlock>
				{message.attachments && (
					<MessageSystemBlock>
						<Attachments attachments={message.attachments} file={message.file} />
					</MessageSystemBlock>
				)}
				{message.actionLinks?.length && (
					<MessageActions
						mid={message._id}
						actions={message.actionLinks.map(({ method_id: methodId, i18nLabel, ...action }) => ({
							methodId,
							i18nLabel: i18nLabel as TranslationKey,
							...action,
						}))}
						runAction={runActionLink(message)}
					/>
				)}
			</MessageSystemContainer>
		</MessageSystem>
	);
};

export default memo(SystemMessage);
