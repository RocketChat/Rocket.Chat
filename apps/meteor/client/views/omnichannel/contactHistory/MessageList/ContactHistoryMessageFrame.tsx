import { isQuoteAttachment, type IMessage, type MessageAttachment } from '@rocket.chat/core-typings';
import {
	Message as MessageTemplate,
	MessageLeftContainer,
	MessageContainer,
	MessageDivider,
	MessageSystem,
	MessageSystemLeftContainer,
	MessageSystemContainer,
	MessageSystemBlock,
	MessageSystemName,
	MessageSystemBody,
	MessageSystemTimestamp,
	Bubble,
} from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserCard } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import MessageContentBody from '../../../../components/message/MessageContentBody';
import Attachments from '../../../../components/message/content/Attachments';
import UiKitMessageBlock from '../../../../components/message/uikit/UiKitMessageBlock';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import { toPlainTextRoot } from '../../../../lib/toPlainTextRoot';

export type ContactHistoryMessageFrameProps = {
	message: IMessage;
	isNewDay: boolean;
	showUserAvatar: boolean;
	/** What stands to the left of the message: the author's avatar, or the status indicators of a grouped message */
	leading?: ReactNode;
	/** The author and time line; a message without one continues the group above it */
	header?: ReactNode;
};

/** The parts every contact history message shares: the day divider, the closing notice and the content around a leading column and an optional header */
const ContactHistoryMessageFrame = ({ message, isNewDay, showUserAvatar, leading, header }: ContactHistoryMessageFrameProps) => {
	const { t } = useTranslation();
	const { triggerProps, openUserCard } = useUserCard();

	const format = useFormatDate();
	const formatTime = useFormatTime();

	const quotes = message?.attachments?.filter(isQuoteAttachment) || [];

	const attachments = message?.attachments?.filter((attachment: MessageAttachment) => !isQuoteAttachment(attachment)) || [];

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
			{isNewDay && (
				<MessageDivider>
					<Bubble small secondary>
						{format(message.ts)}
					</Bubble>
				</MessageDivider>
			)}
			<MessageTemplate isPending={message.temp} sequential={!header} role='listitem' data-qa='chat-history-message'>
				<MessageLeftContainer>{leading}</MessageLeftContainer>
				<MessageContainer>
					{header}
					{!!quotes?.length && <Attachments attachments={quotes} />}
					{!message.blocks && (
						<MessageContentBody
							data-qa-type='message-body'
							md={message.md ?? toPlainTextRoot(message.msg)}
							mentions={message.mentions}
							channels={message.channels}
						/>
					)}
					{message.blocks && <UiKitMessageBlock rid={message.rid} mid={message._id} blocks={message.blocks} />}
					{!!attachments && <Attachments attachments={attachments} />}
				</MessageContainer>
			</MessageTemplate>
		</>
	);
};

export default ContactHistoryMessageFrame;
