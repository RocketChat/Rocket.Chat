import { MessageQuoteAttachment, IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement } from 'react';

import Attachments from '.';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import MessageMarkup from '../../../views/room/MessageList/components/MessageMarkup';
import { useParsedMessage } from '../../../views/room/MessageList/hooks/useParsedMessage';
import MarkdownText from '../../MarkdownText';
import AttachmentAuthor from './Attachment/AttachmentAuthor';
import AttachmentAuthorAvatar from './Attachment/AttachmentAuthorAvatar';
import AttachmentAuthorName from './Attachment/AttachmentAuthorName';
import AttachmentContent from './Attachment/AttachmentContent';
import AttachmentDetails from './Attachment/AttachmentDetails';
import AttachmentInner from './Attachment/AttachmentInner';

const hover = css`
	&:hover,
	&:focus {
		.rcx-attachment__details {
			background: ${colors.n200} !important;
			border-color: ${colors.n300} !important;
			border-inline-start-color: ${colors.n600} !important;
		}
	}
`;

type QuoteAttachmentProps = {
	attachment: MessageQuoteAttachment;
	message: IMessage;
};

export const QuoteAttachment = ({ attachment, message }: QuoteAttachmentProps): ReactElement => {
	const format = useTimeAgo();

	const msg: IMessage = {
		_id: message._id,
		ts: message.ts,
		u: message.u,
		_updatedAt: message._updatedAt,
		rid: message.rid,
		md: undefined,
		msg: attachment.text,
	};

	const tokens = useParsedMessage(msg);

	return (
		<>
			<AttachmentContent className={hover} width='full'>
				<AttachmentDetails
					is='blockquote'
					borderRadius='x2'
					borderWidth='x2'
					borderStyle='solid'
					borderColor='neutral-200'
					borderInlineStartColor='neutral-500'
				>
					<AttachmentAuthor>
						<AttachmentAuthorAvatar url={attachment.author_icon} />
						<AttachmentAuthorName
							{...(attachment.author_name && { is: 'a', href: attachment.author_link, target: '_blank', color: 'info' })}
						>
							{attachment.author_name}
						</AttachmentAuthorName>
						{attachment.ts && (
							<Box
								fontScale='c1'
								{...(attachment.message_link ? { is: 'a', href: attachment.message_link, color: 'hint' } : { color: 'hint' })}
							>
								{format(attachment.ts)}
							</Box>
						)}
					</AttachmentAuthor>
					{tokens ? <MessageMarkup tokens={tokens} /> : <MarkdownText parseEmoji variant='document' content={attachment.text} />}
					{attachment.attachments && (
						<AttachmentInner>
							<Attachments attachments={attachment.attachments} message={message} />
						</AttachmentInner>
					)}
				</AttachmentDetails>
			</AttachmentContent>
		</>
	);
};
