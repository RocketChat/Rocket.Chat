import { css } from '@rocket.chat/css-in-js';
import { IconButton, Box, Margins } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { useSubscription } from 'use-subscription';

import Attachments from '../../../../../../components/message/Attachments';
import { useChat } from '../../../../contexts/ChatContext';

const MessageBoxReplies = (): ReactElement | null => {
	const chat = useChat();

	if (!chat?.composer?.quotedMessages) {
		throw new Error('Chat context not found');
	}

	const replies = useSubscription({
		getCurrentValue: chat.composer.quotedMessages.get,
		subscribe: chat.composer.quotedMessages.subscribe,
	});

	if (!replies.length) {
		return null;
	}

	const closeWrapperStyle = css`
		position: absolute;
		right: 0.5rem;
		top: 0.75rem;
	`;

	return (
		<Box mbe='x8' position='relative'>
			{replies.map((reply, key) => {
				console.log(reply);
				return (
					<Margins block='x4' key={key}>
						<Box display='flex' position='relative'>
							<Attachments
								attachments={[
									{
										...(!reply.attachments && { text: reply.msg }),
										author_name: reply.u.username,
										author_icon: `/avatar/${reply.u.username}`,
										message_link: 'test',
										ts: reply.ts,
										attachments: reply.attachments,
									} as any,
								]}
							/>
							<Box
								className={closeWrapperStyle}
								// className='rc-message-box__icon cancel-reply'
								data-mid={reply._id}
								onClick={(): void => {
									chat.composer?.dismissQuotedMessage(reply._id);
								}}
							>
								<IconButton mini icon='cross' />
							</Box>
						</Box>
					</Margins>
				);
			})}
		</Box>
	);
};

export default memo(MessageBoxReplies);
