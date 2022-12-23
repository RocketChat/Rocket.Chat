import type { ImageAttachmentProps } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import MarkdownText from '../../../../MarkdownText';
import { useCollapse } from '../hooks/useCollapse';
import Attachment from '../structure/Attachment';
import AttachmentContent from '../structure/AttachmentContent';
import AttachmentDescription from '../structure/AttachmentDescription';
import AttachmentDownload from '../structure/AttachmentDownload';
import AttachmentImage from '../structure/AttachmentImage';
import AttachmentRow from '../structure/AttachmentRow';
import AttachmentSize from '../structure/AttachmentSize';
import AttachmentTitle from '../structure/AttachmentTitle';
import { useLoadImage } from './hooks/useLoadImage';

export const ImageAttachment: FC<ImageAttachmentProps> = ({
	title,
	image_url: url,
	image_preview: imagePreview,
	collapsed: collapsedDefault = false,
	image_size: size,
	image_dimensions: imageDimensions = {
		height: 360,
		width: 480,
	},
	description,
	title_link: link,
	title_link_download: hasDownload,
}) => {
	const [loadImage, setLoadImage] = useLoadImage();
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();
	return (
		<Attachment>
			{description && (
				<AttachmentDescription>
					<MarkdownText parseEmoji variant='inline' content={description} />
				</AttachmentDescription>
			)}
			<AttachmentRow>
				<AttachmentTitle>{title}</AttachmentTitle>
				{size && <AttachmentSize size={size} />}
				{collapse}
				{hasDownload && link && <AttachmentDownload title={title} href={getURL(link)} />}
			</AttachmentRow>
			{!collapsed && (
				<AttachmentContent>
					<AttachmentImage
						{...imageDimensions}
						loadImage={loadImage}
						setLoadImage={setLoadImage}
						dataSrc={getURL(link || url)}
						src={getURL(url)}
						previewUrl={`data:image/png;base64,${imagePreview}`}
					/>
				</AttachmentContent>
			)}
		</Attachment>
	);
};
