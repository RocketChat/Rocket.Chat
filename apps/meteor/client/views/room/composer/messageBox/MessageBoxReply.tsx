import type { IMessage, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { IconButton, Box, Margins } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { memo } from 'react';

import { QuoteAttachment } from '../../../../components/message/content/attachments/QuoteAttachment';
import AttachmentProvider from '../../../../providers/AttachmentProvider';
import { useChat } from '../../contexts/ChatContext';

const MessageBoxReply = ({ reply }: { reply: IMessage }): ReactElement | null => {
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
				<AttachmentProvider>
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
				</AttachmentProvider>
				<Box
					className={closeWrapperStyle}
					data-mid={reply._id}
					onClick={(): void => {
						chat?.composer?.dismissQuotedMessage(reply._id);
					}}
				>
					<IconButton mini icon='cross' />
				</Box>
			</Box>
		</Margins>
	);
};

export default memo(MessageBoxReply);
