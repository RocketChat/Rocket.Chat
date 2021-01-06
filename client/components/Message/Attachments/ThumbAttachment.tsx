import { Avatar } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { Attachment, AttachmentPropsBase } from './Attachment';
import MarkdownText from '../../MarkdownText';

export type ThumbAttachmentProps = {
	thumb_url: string;
	text: string;
} & AttachmentPropsBase;

export const ThumbAttachment: FC<ThumbAttachmentProps> = ({ thumb_url: url, text }) => <>
	<Attachment.Content maxWidth='480px' width='full'>
		<Avatar { ...{ url, size: 'x124' } as any} />
		<MarkdownText content={text} />
	</Attachment.Content>
</>;
