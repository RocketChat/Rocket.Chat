import React, { FC } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useCollapse } from '../hooks/useCollapse';
import { Attachment, AttachmentPropsBase } from '../Attachment';
import { FileProp } from '..';
import { useMediaUrl } from '../context/AttachmentContext';

export type VideoAttachmentProps = {
	video_url: string;
	video_type: string;
	video_size: number;
	file?: FileProp;
} & AttachmentPropsBase;

export const VideoAttachment: FC<VideoAttachmentProps> = ({ title,
	video_url: url,
	video_type: type,
	collapsed: collapsedDefault = false,
	video_size: size,
	description,
	title_link: link,
	title_link_download: hasDownload,
}) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	// useTranslation();
	const getURL = useMediaUrl();
	return <Attachment>
		<Attachment.Row>
			<Attachment.Title>{title}</Attachment.Title>
			{size && <Attachment.Size size={size}/>}
			{collapse}
			{hasDownload && link && <Attachment.Download title={title} href={getURL(link)}/>}
		</Attachment.Row>
		{ !collapsed && <Attachment.Content width='full'>
			<Box is='video' width='full' controls>
				<source src={getURL(url)} type={type}/>
			</Box>
			{description && <Attachment.Details is='figcaption'>{description}</Attachment.Details>}
		</Attachment.Content>}
	</Attachment>;
};
