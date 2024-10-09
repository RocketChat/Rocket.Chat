import {
	Message,
	Box,
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewDescription,
	MessageGenericPreviewTitle,
	MessageSystemBody,
	MessageDivider,
	Bubble,
} from '@rocket.chat/fuselage';
import type { VisitorSearchChatsResult } from '@rocket.chat/rest-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React, { memo } from 'react';

import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { clickableItem } from '../../../../../lib/clickableItem';
import ContactInfoHistoryItem from '../../components/ContactInfoHistoryItem';
import ContactHistoryMessagesList from '../../contactHistory/MessageList/ContactHistoryMessagesList';

type ContactHistoryItemProps = {
	history: VisitorSearchChatsResult;
	setChatId: Dispatch<SetStateAction<string>>;
};

function ContactHistoryItem({ history, ...props }: ContactHistoryItemProps): ReactElement {
	const t = useTranslation();
	const { navigate, getRouteParameters } = useRouter();
	const { id, tab } = getRouteParameters();
	const formatDate = useFormatDate();

	const username = history.servedBy?.username;
	const hasClosingMessage = !!history.closingMessage?.msg?.trim();

	const onClick = () => {
		navigate(`/live/${id}/${tab}/chat-history/${history._id}`);
	};

	console.log(history);

	return (
		<>
			<MessageDivider>
				<Bubble small secondary>
					{formatDate(history.ts)}
				</Bubble>
			</MessageDivider>
			<Box pi={16}>
				<ContactInfoHistoryItem name={history.fname} time={history.ts} onClick={onClick} />
			</Box>
			{/* <Box pbs={16} is={Message} onClick={onClick} data-qa='chat-history-item' {...props}>
				<Message.LeftContainer>{username && <UserAvatar username={username} size='x36' />}</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<Message.Name title={username}>{username}</Message.Name>
						{history.closingMessage?.ts && <Message.Timestamp>{formatDate(history.closingMessage?.ts)}</Message.Timestamp>}
					</Message.Header>
					<Message.Body>
						<MessageSystemBody title={t('Conversation_closed_without_comment')}>
							{t('Conversation_closed_without_comment')}
						</MessageSystemBody>
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
			</Box> */}
		</>
	);
}

export default memo(clickableItem(ContactHistoryItem));
