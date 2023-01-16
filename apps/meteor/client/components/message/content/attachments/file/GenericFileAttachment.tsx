import type { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import MarkdownText from '../../../../MarkdownText';
import MessageContentBody from '../../../MessageContentBody';
import Attachment from '../structure/Attachment';
import AttachmentDescription from '../structure/AttachmentDescription';
import AttachmentDownload from '../structure/AttachmentDownload';
import AttachmentRow from '../structure/AttachmentRow';
import AttachmentSize from '../structure/AttachmentSize';
import AttachmentTitle from '../structure/AttachmentTitle';
import AttachmentTitleLink from '../structure/AttachmentTitleLink';

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
