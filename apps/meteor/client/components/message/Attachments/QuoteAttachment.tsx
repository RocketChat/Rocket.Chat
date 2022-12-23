import type { MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import Attachments from '.';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import MessageContentBody from '../../../views/room/MessageList/components/MessageContentBody';
import AttachmentAuthor from './Attachment/AttachmentAuthor';
import AttachmentAuthorAvatar from './Attachment/AttachmentAuthorAvatar';
import AttachmentAuthorName from './Attachment/AttachmentAuthorName';
import AttachmentContent from './Attachment/AttachmentContent';
import AttachmentDetails from './Attachment/AttachmentDetails';
import AttachmentInner from './Attachment/AttachmentInner';

// TODO: remove this team collaboration
const quoteStyles = css`
	.rcx-attachment__details {
		.rcx-message-body {
			color: ${Palette.text['font-hint']};
		}
	}
	&:hover,
	&:focus {
		.rcx-attachment__details {
			background: ${Palette.surface['surface-hover']};
			border-color: ${Palette.stroke['stroke-light']};
			border-inline-start-color: ${Palette.stroke['stroke-medium']};
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
					borderColor='extra-light'
					borderInlineStartColor='light'
				>
					<AttachmentAuthor>
						<AttachmentAuthorAvatar url={attachment.author_icon} />
						<AttachmentAuthorName
							{...(attachment.author_name && { is: 'a', href: attachment.author_link, target: '_blank', color: 'hint' })}
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
