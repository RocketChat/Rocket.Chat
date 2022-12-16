import type { IMessage } from '@rocket.chat/core-typings';
import {
	Message as MessageTemplate,
	MessageLeftContainer,
	MessageContainer,
	MessageBody,
	MessageBlock,
	MessageDivider,
	MessageName,
	MessageUsername,
	MessageTimestamp,
	MessageHeader as MessageHeaderTemplate,
	MessageSystem,
	MessageSystemLeftContainer,
	MessageSystemContainer,
	MessageSystemBlock,
	MessageSystemName,
	MessageSystemBody,
	MessageSystemTimestamp,
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import MessageBlockUiKit from '../../../blocks/MessageBlock';
import MessageContentBody from '../../../room/MessageList/components/MessageContentBody';
import { MessageIndicators } from '../../../room/MessageList/components/MessageIndicators';
import { useMessageActions } from '../../../room/contexts/MessageContext';

const ContactHistoryMessage: FC<{
	message: IMessage;
	sequential: boolean;
	isNewDay: boolean;
}> = ({ message, sequential, isNewDay }) => {
	const format = useFormatDate();
	const formatTime = useFormatTime();

	const t = useTranslation();
	const {
		actions: { openUserCard },
	} = useMessageActions();

	if (message.t === 'livechat-close') {
		return (
			<MessageSystem>
				<MessageSystemLeftContainer>
					<UserAvatar
						url={message.avatar}
						username={message.u.username}
						size={'x18'}
						onClick={openUserCard(message.u.username)}
						style={{ cursor: 'pointer' }}
					/>
				</MessageSystemLeftContainer>
				<MessageSystemContainer>
					<MessageSystemBlock>
						<MessageSystemName data-username={message.u.username} data-qa-type='username'>
							@{message.u.username}
						</MessageSystemName>
						<MessageSystemBody title={message.msg}>{t('Conversation_closed', { comment: message.msg })}</MessageSystemBody>
						<MessageSystemTimestamp title={formatTime(message.ts)}>{formatTime(message.ts)}</MessageSystemTimestamp>
					</MessageSystemBlock>
				</MessageSystemContainer>
			</MessageSystem>
		);
	}

	return (
		<>
			{isNewDay && <MessageDivider>{format(message.ts)}</MessageDivider>}
			<MessageTemplate isPending={message.temp} sequential={sequential} role='listitem' data-qa='chat-history-message'>
				<MessageLeftContainer>
					{!sequential && message.u.username && (
						<UserAvatar
							url={message.avatar}
							username={message.u.username}
							size={'x36'}
							onClick={openUserCard(message.u.username)}
							style={{ cursor: 'pointer' }}
						/>
					)}
					{sequential && <MessageIndicators message={message} />}
				</MessageLeftContainer>

				<MessageContainer>
					{!sequential && (
						<MessageHeaderTemplate>
							<MessageName title={`@${message.u.username}`} data-username={message.u.username}>
								{message.alias || getUserDisplayName(message.u.name, message.u.username, false)}
							</MessageName>
							<MessageUsername data-username={message.u.username} data-qa-type='username'>
								@{message.u.username}
							</MessageUsername>
							<MessageTimestamp title={formatTime(message.ts)}>{formatTime(message.ts)}</MessageTimestamp>
							<MessageIndicators message={message} />
						</MessageHeaderTemplate>
					)}
					{!message.blocks && message.md && (
						<MessageBody data-qa-type='message-body'>
							<MessageContentBody md={message.md} mentions={message.mentions} channels={message.channels} />
						</MessageBody>
					)}
					{message.blocks && (
						<MessageBlock fixedWidth>
							<MessageBlockUiKit mid={message._id} blocks={message.blocks} appId rid={message.rid} />
						</MessageBlock>
					)}
				</MessageContainer>
			</MessageTemplate>
		</>
	);
};

export default memo(ContactHistoryMessage);
