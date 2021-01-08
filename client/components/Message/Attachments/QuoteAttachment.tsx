import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { Attachment, AttachmentPropsBase } from './Attachment';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import MarkdownText from '../../MarkdownText';

import Attachments from '.';

export type QuoteAttachmentProps = {
	author_name: string;
	author_link: string;
	author_icon: string;
	message_link?: string;
	text: string;
	attachments?: Array<QuoteAttachmentProps>;
} & AttachmentPropsBase;

export const QuoteAttachment: FC<QuoteAttachmentProps> = ({ author_icon: url, author_name: name, author_link: authorLink, message_link: messageLink, ts, text, attachments }) => {
	const format = useTimeAgo();
	return <>
		<Attachment.Content maxWidth='480px' width='full' borderRadius='x2' borderWidth='x2' borderStyle='solid' borderColor='neutral-200' >
			<Attachment.Details is='blockquote'>
				<Attachment.Author>
					<Attachment.AuthorAvatar url={url} />
					<Attachment.AuthorName {...authorLink && { is: 'a', href: authorLink, target: '_blank', color: undefined }}>{name}</Attachment.AuthorName>
					<Box fontScale='c1' {...messageLink ? { is: 'a', href: messageLink } : { color: 'hint' }}>{format(ts)}</Box>
				</Attachment.Author>
				<MarkdownText content={text} />
				{attachments && <Attachment.Inner><Attachments attachments={attachments} /></Attachment.Inner>}
			</Attachment.Details>
		</Attachment.Content>
	</>;
};
