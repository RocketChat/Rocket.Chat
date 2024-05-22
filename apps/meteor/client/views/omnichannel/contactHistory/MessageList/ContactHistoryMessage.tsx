import type { IMessage } from '@rocket.chat/core-typings';
import {
	Message as MessageTemplate,
	MessageLeftContainer,
	MessageContainer,
	MessageBody,
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
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';

import { getUserDisplayName } from '../../../../../lib/getUserDisplayName';
import MessageContentBody from '../../../../components/message/MessageContentBody';
import StatusIndicators from '../../../../components/message/StatusIndicators';
import Attachments from '../../../../components/message/content/Attachments';
import UiKitMessageBlock from '../../../../components/message/uikit/UiKitMessageBlock';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import { useUserCard } from '../../../room/contexts/UserCardContext';

const ContactHistoryMessage: FC<{
	message: IMessage;
	sequential: boolean;
	isNewDay: boolean;
	showUserAvatar: boolean;
}> = ({ message, sequential, isNewDay, showUserAvatar }) => {
	const t = useTranslation();
	const { triggerProps, openUserCard } = useUserCard();

	const format = useFormatDate();
	const formatTime = useFormatTime();

	if (message.t === 'livechat-close') {
		return (
			<MessageSystem>
				<MessageSystemLeftContainer>
					{showUserAvatar && (
						<UserAvatar
							url={message.avatar}
							username={message.u.username}
							size='x18'
							onClick={(e) => openUserCard(e, message.u.username)}
							style={{ cursor: 'pointer' }}
							role='button'
							{...triggerProps}
						/>
					)}
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
					{!sequential && message.u.username && showUserAvatar && (
						<UserAvatar
							url={message.avatar}
							username={message.u.username}
							size='x36'
							onClick={(e) => openUserCard(e, message.u.username)}
							style={{ cursor: 'pointer' }}
							role='button'
							{...triggerProps}
						/>
					)}
					{sequential && <StatusIndicators message={message} />}
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
							<StatusIndicators message={message} />
						</MessageHeaderTemplate>
					)}
					{!message.blocks && message.md && (
						<MessageBody data-qa-type='message-body' dir='auto'>
							<MessageContentBody md={message.md} mentions={message.mentions} channels={message.channels} />
						</MessageBody>
					)}
					{message.blocks && <UiKitMessageBlock rid={message.rid} mid={message._id} blocks={message.blocks} />}
					{message.attachments && <Attachments attachments={message.attachments} />}
				</MessageContainer>
			</MessageTemplate>
		</>
	);
};

export default memo(ContactHistoryMessage);
