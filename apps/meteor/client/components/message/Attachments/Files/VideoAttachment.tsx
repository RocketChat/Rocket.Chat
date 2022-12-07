import type { VideoAttachmentProps } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { userAgentMIMETypeFallback } from '../../../../lib/utils/userAgentMIMETypeFallback';
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
	border: 2px solid ${Palette.stroke['stroke-extra-light']} !important;
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
						<source src={getURL(url)} type={userAgentMIMETypeFallback(type)} />
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
