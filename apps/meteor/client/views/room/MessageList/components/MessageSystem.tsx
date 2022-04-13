import { IMessage } from '@rocket.chat/core-typings';
import {
	MessageSystem as MessageSystemTemplate,
	MessageSystemBody,
	MessageSystemContainer,
	MessageSystemLeftContainer,
	MessageSystemName,
	MessageSystemTimestamp,
	MessageSystemBlock,
} from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import Attachments from '../../../../components/Message/Attachments';
import MessageActions from '../../../../components/Message/MessageActions';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { TranslationKey, useTranslation } from '../../../../contexts/TranslationContext';
import { useMessageActions, useMessageRunActionLink } from '../../contexts/MessageContext';
import { useMessageListShowRealName } from '../contexts/MessageListContext';

export const MessageSystem: FC<{ message: IMessage }> = ({ message }) => {
	const t = useTranslation();
	const { formatters } = useMessageActions();
	const runActionLink = useMessageRunActionLink();
	const showUsername = useMessageListShowRealName();

	const messageType = MessageTypes.getType(message);

	return (
		<MessageSystemTemplate>
			<MessageSystemLeftContainer>
				<UserAvatar username={message.u.username} size='x18' />
			</MessageSystemLeftContainer>
			<MessageSystemContainer>
				<MessageSystemBlock>
					<MessageSystemName>{(showUsername && message.u.name) || message.u.username}</MessageSystemName>
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
