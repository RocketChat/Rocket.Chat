import { VideoAttachmentProps } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import AttachmentContent from '../Attachment/AttachmentContent';
import AttachmentDetails from '../Attachment/AttachmentDetails';
import AttachmentDownload from '../Attachment/AttachmentDownload';
import AttachmentRow from '../Attachment/AttachmentRow';
import AttachmentSize from '../Attachment/AttachmentSize';
import AttachmentTitle from '../Attachment/AttachmentTitle';
import { useCollapse } from '../hooks/useCollapse';

const videoAttachmentCss = css`
	border: 2px solid ${colors.n200} !important;
	border-radius: 2px;
	display: flex;
	flex-direction: column;
`;

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
				<AttachmentContent width='full' className={videoAttachmentCss}>
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
