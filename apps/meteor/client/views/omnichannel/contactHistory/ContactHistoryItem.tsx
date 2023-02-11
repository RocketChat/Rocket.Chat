import {
	Message,
	Box,
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewDescription,
	MessageGenericPreviewTitle,
	MessageSystemBody,
} from '@rocket.chat/fuselage';
import type { VisitorSearchChatsResult } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React, { memo } from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { clickableItem } from '../../../lib/clickableItem';

type ContactHistoryItemProps = {
	history: VisitorSearchChatsResult;
	setChatId: Dispatch<SetStateAction<string>>;
};

function ContactHistoryItem({ history, setChatId, ...props }: ContactHistoryItemProps): ReactElement {
	const t = useTranslation();
	const formatDate = useFormatDateAndTime();
	const username = history.servedBy?.username;
	const hasClosingMessage = !!history.closingMessage?.msg?.trim();
	const onClick = (): void => {
		setChatId(history._id);
	};

	return (
		<Box pbs='x16' is={Message} onClick={onClick} data-qa='chat-history-item' {...props}>
			<Message.LeftContainer>
				{username && <UserAvatar username={username} className='rcx-message__avatar' size='x36' />}
			</Message.LeftContainer>
			<Message.Container>
				<Message.Header>
					<Message.Name title={username}>{username}</Message.Name>
					{history.closingMessage?.ts && <Message.Timestamp>{formatDate(history.closingMessage?.ts)}</Message.Timestamp>}
				</Message.Header>
				<Message.Body>
					<MessageSystemBody title={t('Conversation_closed_without_comment')}>{t('Conversation_closed_without_comment')}</MessageSystemBody>
					{hasClosingMessage && (
						<MessageGenericPreview>
							<MessageGenericPreviewContent>
								<MessageGenericPreviewTitle>{t('Closing_chat_message')}:</MessageGenericPreviewTitle>
								<MessageGenericPreviewDescription clamp>
									<Box title={history.closingMessage?.msg}>{history.closingMessage?.msg}</Box>
								</MessageGenericPreviewDescription>
							</MessageGenericPreviewContent>
						</MessageGenericPreview>
					)}
				</Message.Body>
				<Message.Metrics>
					<Message.Metrics.Item>
						<Message.Metrics.Item.Icon name='thread' />
						<Message.Metrics.Item.Label>{history.msgs}</Message.Metrics.Item.Label>
					</Message.Metrics.Item>
				</Message.Metrics>
			</Message.Container>
		</Box>
	);
}

export default memo(clickableItem(ContactHistoryItem));
