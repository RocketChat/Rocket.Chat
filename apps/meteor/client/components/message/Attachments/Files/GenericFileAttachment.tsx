import { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';

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
			{description && <MarkdownText parseEmoji content={description} />}
			<Attachment.Row>
				{hasDownload && link ? <Attachment.TitleLink link={getURL(link)} title={title} /> : <Attachment.Title>{title}</Attachment.Title>}
				{size && <Attachment.Size size={size} />}
				{/* {collapse} */}
				{hasDownload && link && <Attachment.Download title={title} href={getURL(link)} />}
			</Attachment.Row>
			{/* { !collapsed && <Attachment.Content>
			<Attachment.Details>
				{hasDownload && link && <Attachment.Download href={link}/>}
				<Attachment.Row><Attachment.Title { ...hasDownload && link && { is: 'a', href: link } } >{name}</Attachment.Title></Attachment.Row>
				<Attachment.Row>{size && <Attachment.Size size={size}/>}<Attachment.Title>{format && size && ' | '}{format}</Attachment.Title></Attachment.Row>
			</Attachment.Details>
		</Attachment.Content> } */}
		</Attachment>
	);
};
