import { MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement } from 'react';

import Attachments from '.';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import MessageContentBody from '../../../views/room/MessageList/components/MessageContentBody';
import AttachmentAuthor from './Attachment/AttachmentAuthor';
import AttachmentAuthorAvatar from './Attachment/AttachmentAuthorAvatar';
import AttachmentAuthorName from './Attachment/AttachmentAuthorName';
import AttachmentContent from './Attachment/AttachmentContent';
import AttachmentDetails from './Attachment/AttachmentDetails';
import AttachmentInner from './Attachment/AttachmentInner';

const quoteStyles = css`
	.rcx-attachment__details {
		.rcx-message-body {
			color: ${colors.n700} !important;
		}
	}
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
};

export const QuoteAttachment = ({ attachment }: QuoteAttachmentProps): ReactElement => {
	const format = useTimeAgo();

	return (
		<>
			<AttachmentContent className={quoteStyles} width='full'>
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
					{attachment.md ? <MessageContentBody md={attachment.md} /> : attachment.text}
					{attachment.attachments && (
						<AttachmentInner>
							<Attachments attachments={attachment.attachments} />
						</AttachmentInner>
					)}
				</AttachmentDetails>
			</AttachmentContent>
		</>
	);
};
