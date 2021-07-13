import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { FC } from 'react';

import Attachments from '.';
import { MessageQuoteAttachment } from '../../../../definition/IMessage/MessageAttachment/MessageQuoteAttachment';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import MarkdownText from '../../MarkdownText';
import Attachment from './Attachment';

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

export const QuoteAttachment: FC<MessageQuoteAttachment> = ({
	author_icon: url,
	author_name: name,
	author_link: authorLink,
	message_link: messageLink,
	ts,
	text,
	attachments,
}) => {
	const format = useTimeAgo();
	return (
		<>
			<Attachment.Content className={hover} width='full'>
				<Attachment.Details
					is='blockquote'
					borderRadius='x2'
					borderWidth='x2'
					borderStyle='solid'
					borderColor='neutral-200'
					borderInlineStartColor='neutral-600'
				>
					<Attachment.Author>
						<Attachment.AuthorAvatar url={url} />
						<Attachment.AuthorName
							{...(authorLink && { is: 'a', href: authorLink, target: '_blank', color: undefined })}
						>
							{name}
						</Attachment.AuthorName>
						<Box
							fontScale='c1'
							{...(messageLink ? { is: 'a', href: messageLink } : { color: 'hint' })}
						>
							{format(ts)}
						</Box>
					</Attachment.Author>
					<MarkdownText parseEmoji variant='inline' content={text} />
					{attachments && (
						<Attachment.Inner>
							<Attachments attachments={attachments} />
						</Attachment.Inner>
					)}
				</Attachment.Details>
			</Attachment.Content>
		</>
	);
};
