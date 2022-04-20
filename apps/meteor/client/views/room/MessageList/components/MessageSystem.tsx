import { IMessage } from '@rocket.chat/core-typings';
import {
	MessageSystem as MessageSystemTemplate,
	MessageSystemBody,
	MessageSystemContainer,
	MessageSystemLeftContainer,
	MessageSystemName,
	MessageSystemTimestamp,
	MessageSystemBlock,
	MessageUsername,
} from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import Attachments from '../../../../components/Message/Attachments';
import MessageActions from '../../../../components/Message/MessageActions';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { TranslationKey, useTranslation } from '../../../../contexts/TranslationContext';
import { useUserData } from '../../../../hooks/useUserData';
import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { UserPresence } from '../../../../lib/presence';
import { useMessageActions, useMessageRunActionLink } from '../../contexts/MessageContext';
import { useMessageListShowRealName, useMessageListShowUsername } from '../contexts/MessageListContext';

export const MessageSystem: FC<{ message: IMessage }> = ({ message }) => {
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

	return (
		<MessageSystemTemplate>
			<MessageSystemLeftContainer>
				<UserAvatar username={message.u.username} size='x18' />
			</MessageSystemLeftContainer>
			<MessageSystemContainer>
				<MessageSystemBlock>
					<MessageSystemName onClick={user.username !== undefined ? openUserCard(user.username) : undefined} style={{ cursor: 'pointer' }}>
						{getUserDisplayName(user.name, user.username, showRealName)}
					</MessageSystemName>
					{showUsername && (
						<MessageUsername
							data-username={user.username}
							onClick={user.username !== undefined ? openUserCard(user.username) : undefined}
							style={{ cursor: 'pointer' }}
						>
							@{user.username}
						</MessageUsername>
					)}
					{messageType && (
						<MessageSystemBody
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
		</MessageSystemTemplate>
	);
};

export default memo(MessageSystem);
