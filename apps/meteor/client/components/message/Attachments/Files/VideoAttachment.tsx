import { VideoAttachmentProps } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import AttachmentContent from '../Attachment/Content';
import AttachmentDetails from '../Attachment/Details';
import AttachmentDownload from '../Attachment/Download';
import AttachmentRow from '../Attachment/Row';
import AttachmentSize from '../Attachment/Size';
import AttachmentTitle from '../Attachment/Title';
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
			<AttachmentRow>
				<AttachmentTitle>{title}</AttachmentTitle>
				{size && <AttachmentSize size={size} />}
				{collapse}
				{hasDownload && link && <AttachmentDownload title={title} href={getURL(link)} />}
			</AttachmentRow>
			{!collapsed && (
				<AttachmentContent width='full'>
					<Box is='video' width='full' controls preload='metadata'>
						<source src={getURL(url)} type={type} />
					</Box>
					{description && (
						<AttachmentDetails is='figcaption'>
							<MarkdownText parseEmoji variant='inline' content={description} />
						</AttachmentDetails>
					)}
				</AttachmentContent>
			)}
		</Attachment>
	);
};
