import type { MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { IconButton, Box, Margins } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useSyncExternalStore } from 'react';

import { getUserDisplayName } from '../../../../../lib/getUserDisplayName';
import { QuoteAttachment } from '../../../../components/message/content/attachments/QuoteAttachment';
import AttachmentProvider from '../../../../providers/AttachmentProvider';
import { useChat } from '../../contexts/ChatContext';

const MessageBoxReplies = (): ReactElement | null => {
	const chat = useChat();

	if (!chat?.composer?.quotedMessages) {
		throw new Error('Chat context not found');
	}

	const replies = useSyncExternalStore(chat.composer.quotedMessages.subscribe, chat.composer.quotedMessages.get);

	const useRealName = useSetting('UI_Use_Real_Name', false);

	if (!replies.length) {
		return null;
	}

	const closeWrapperStyle = css`
		position: absolute;
		right: 0.5rem;
		top: 0.75rem;
	`;

	return (
		<Box mbe={8} position='relative' overflowY='auto' maxHeight='x256'>
			{replies.map((reply, key) => (
				<Margins block={4} key={key}>
					<Box display='flex' position='relative'>
						<AttachmentProvider>
							<QuoteAttachment
								attachment={
									{
										text: reply.msg,
										md: reply.md,
										author_name: reply.alias || getUserDisplayName(reply.u.name, reply.u.username, useRealName),
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
								chat.composer?.dismissQuotedMessage(reply._id);
							}}
						>
							<IconButton mini icon='cross' />
						</Box>
					</Box>
				</Margins>
			))}
		</Box>
	);
};

export default memo(MessageBoxReplies);
