import { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MarkdownText from '../../../MarkdownText';
import Attachment, {
	AttachmentRow,
	AttachmentTitleLink,
	AttachmentTitle,
	AttachmentSize,
	AttachmentDownload,
	AttachmentDescription,
} from '../Attachment';

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
}) => {
	// const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();
	return (
		<Attachment>
			{description && (
				<AttachmentDescription>
					<MarkdownText parseEmoji content={description} />
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
