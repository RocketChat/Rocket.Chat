import { VideoAttachmentProps } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import { useCollapse } from '../hooks/useCollapse';

export const VideoAttachment: FC<VideoAttachmentProps> = ({
	title,
	video_url: url,
	video_type: type,
	collapsed: collapsedDefault = false,
	video_size: size,
	description,
	title_link: link,
	title_link_download: hasDownload,
}) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();

	return (
		<Attachment>
			<Attachment.Row>
				<Attachment.Title>{title}</Attachment.Title>
				{size && <Attachment.Size size={size} />}
				{collapse}
				{hasDownload && link && <Attachment.Download title={title} href={getURL(link)} />}
			</Attachment.Row>
			{!collapsed && (
				<Attachment.Content width='full'>
					<Box is='video' width='full' controls preload='metadata'>
						<source src={getURL(url)} type={type} />
					</Box>
					{description && (
						<Attachment.Details is='figcaption'>
							<MarkdownText parseEmoji variant='inline' content={description} />
						</Attachment.Details>
					)}
				</Attachment.Content>
			)}
		</Attachment>
	);
};
