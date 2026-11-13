import type { IMessage, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { IconButton, Box, Margins } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { MessageQuoteAttachment as QuoteAttachment } from '@rocket.chat/ui-message-list';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { MessagesProvider } from '../../../../providers/MessagesProvider';
import { useChat } from '../../contexts/ChatContext';

export type MessageBoxReplyProps = { reply: IMessage };

const MessageBoxReply = ({ reply }: MessageBoxReplyProps) => {
	const { t } = useTranslation();
	const chat = useChat();

	const displayName = useUserDisplayName(reply?.u);

	const closeWrapperStyle = css`
		position: absolute;
		right: 0.5rem;
		top: 0.75rem;
	`;

	return (
		<Margins block={4}>
			<Box display='flex' position='relative'>
				<MessagesProvider allowsInteraction={false}>
					<QuoteAttachment
						attachment={
							{
								text: reply.msg,
								md: reply.md,
								author_name: reply.alias || displayName,
								author_icon: `/avatar/${reply.u.username}`,
								ts: reply.ts,
								attachments: reply?.attachments?.map((obj) => ({ ...obj, collapsed: true })),
								collapsed: true,
							} as MessageQuoteAttachment
						}
					/>
				</MessagesProvider>
				<Box
					className={closeWrapperStyle}
					data-mid={reply._id}
					onClick={(): void => {
						chat?.composer?.dismissQuotedMessage(reply._id);
					}}
				>
					<IconButton size='mini' icon='cross' aria-label={t('Dismiss_quoted_message')} />
				</Box>
			</Box>
		</Margins>
	);
};

export default memo(MessageBoxReply);
