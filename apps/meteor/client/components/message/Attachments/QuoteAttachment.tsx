import { MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { FC } from 'react';

import Attachments from '.';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
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

export const QuoteAttachment: FC<MessageQuoteAttachment & { rid: string }> = ({
	author_icon: url,
	author_name: name,
	author_link: authorLink,
	message_link: messageLink,
	ts,
	text,
	attachments,
	rid
}) => {
	const format = useTimeAgo();
	return (
		<>
			<AttachmentContent className={hover} width='full'>
				<AttachmentDetails
					is='blockquote'
					borderRadius='x2'
					borderWidth='x2'
					borderStyle='solid'
					borderColor='neutral-200'
					borderInlineStartColor='neutral-600'
				>
					<AttachmentAuthor>
						<AttachmentAuthorAvatar url={url} />
						<AttachmentAuthorName {...(authorLink && { is: 'a', href: authorLink, target: '_blank', color: undefined })}>
							{name}
						</AttachmentAuthorName>
						{ts && (
							<Box fontScale='c1' {...(messageLink ? { is: 'a', href: messageLink } : { color: 'hint' })}>
								{format(ts)}
							</Box>
						)}
					</AttachmentAuthor>
					<MarkdownText parseEmoji variant='document' content={text} />
					{attachments && (
						<AttachmentInner>
							<Attachments attachments={attachments} rid={rid}/>
						</AttachmentInner>
					)}
				</AttachmentDetails>
			</AttachmentContent>
		</>
	);
};
