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

	return (
		<div className='reply-preview__wrap message-popup'>
			{replies.map((reply) => (
				<div className='reply-preview message-popup'>
					<div className='message'>
						<Attachments attachments={[{ text: reply.msg, author_name: reply.u.username } as any]} />
					</div>
					<div
						className='rc-message-box__icon cancel-reply'
						data-mid='{{replyMessageData._id}}'
						onClick={(): void => {
							chat.composer?.dismissQuotedMessage(reply._id);
						}}
					>
						<svg
							className={`rc-icon rc-message-box__toolbar-formatting-icon rc-message-box__toolbar-formatting-icon--cross`}
							aria-hidden='true'
						>
							<use xlinkHref={`#icon-cross`} />
						</svg>
					</div>
				</div>
			))}
		</div>
	);
};

export default memo(MessageBoxReplies);
