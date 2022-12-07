import type { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import MessageContentBody from '../../../../views/room/MessageList/components/MessageContentBody';
import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import AttachmentDescription from '../Attachment/AttachmentDescription';
import AttachmentDownload from '../Attachment/AttachmentDownload';
import AttachmentRow from '../Attachment/AttachmentRow';
import AttachmentSize from '../Attachment/AttachmentSize';
import AttachmentTitle from '../Attachment/AttachmentTitle';
import AttachmentTitleLink from '../Attachment/AttachmentTitleLink';

export type GenericFileAttachmentProps = {
	file?: FileProp;
} & MessageAttachmentBase;

export const GenericFileAttachment: FC<GenericFileAttachmentProps> = ({
	title,
	// collapsed: collapsedDefault = false,
	description,
	title_link: link,
	title_link_download: hasDownload,
	file: {
		size,
		// format,
		// name,
	} = {},
	md,
}) => {
	// const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();
	return (
		<Attachment>
			{description && (
				<AttachmentDescription>
					{md ? <MessageContentBody md={md} /> : <MarkdownText parseEmoji variant='inline' content={description} />}
				</AttachmentDescription>
			)}
			<AttachmentRow>
				{hasDownload && link ? <AttachmentTitleLink link={getURL(link)} title={title} /> : <AttachmentTitle>{title}</AttachmentTitle>}
				{size && <AttachmentSize size={size} />}

				{hasDownload && link && <AttachmentDownload title={title} href={getURL(link)} />}
			</AttachmentRow>
		</Attachment>
	);
};
