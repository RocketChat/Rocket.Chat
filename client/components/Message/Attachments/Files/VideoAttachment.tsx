import React, { FC } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useCollapse } from '../hooks/useCollapse';
import { Attachment, AttachmentPropsBase } from '../Attachment';
import { getURL } from '../../../../../app/utils/client';

export type VideoAttachmentProps = {
	video_url: string;
	video_type: string;
	video_size: number;
	title_link_download?: string;
} & AttachmentPropsBase;

export const VideoAttachment: FC<VideoAttachmentProps> = ({ title, video_url: url, video_type: type, collapsed: collapsedDefault = false, video_size: size, description }) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	// useTranslation();
	return <Attachment>
		<Attachment.Row>
			<Attachment.Title>{title}</Attachment.Title>
			{size && <Attachment.Size size={size}/>}
			{collapse}
		</Attachment.Row>
		{ !collapsed && <Attachment.Content width='full' maxWidth='480px' border='none'>
			<Box is='video' maxWidth='480px' width='full' controls>
				<source src={getURL(url)} type={type}/>
			</Box>
			{description && <Attachment.Details is='figcaption'>{description}</Attachment.Details>}
		</Attachment.Content>}
	</Attachment>;
};
