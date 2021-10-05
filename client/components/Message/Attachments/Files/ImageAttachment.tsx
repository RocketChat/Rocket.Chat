import React, { FC } from 'react';

import { FileProp } from '..';
import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import { AttachmentPropsBase } from '../Attachment/AttachmentPropsBase';
import { Dimensions } from '../components/Dimensions';
import Image from '../components/Image';
import { useMediaUrl } from '../context/AttachmentContext';
import { useCollapse } from '../hooks/useCollapse';
import { useLoadImage } from '../hooks/useLoadImage';

export type ImageAttachmentProps = {
	image_dimensions: Dimensions;
	image_preview?: string;
	image_url: string;
	image_type: string;
	image_size?: number;
	file?: FileProp;
} & AttachmentPropsBase;

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
			<MarkdownText variant='inline' content={description} />
			<Attachment.Row>
				<Attachment.Title>{title}</Attachment.Title>
				{size && <Attachment.Size size={size} />}
				{collapse}
				{hasDownload && link && <Attachment.Download title={title} href={getURL(link)} />}
			</Attachment.Row>
			{!collapsed && (
				<Attachment.Content>
					<Image
						{...imageDimensions}
						loadImage={loadImage}
						setLoadImage={setLoadImage}
						src={url}
						previewUrl={`data:image/png;base64,${imagePreview}`}
					/>
				</Attachment.Content>
			)}
		</Attachment>
	);
};
