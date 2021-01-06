import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useCollapse } from '../hooks/useCollapse';
import { Attachment, AttachmentPropsBase } from '../Attachment';

type Dimensions = {
	width: number;
	height: number;
};

export type ImageAttachmentProps = {
	image_dimensions?: Dimensions;
	image_preview?: string;
	image_url: string;
	image_type: string;
	image_size?: number;
	title_link_download?: string;
} & AttachmentPropsBase;

export const ImageAttachment: FC<ImageAttachmentProps> = ({ title, image_url: url, image_preview: imagePreview, collapsed: collapsedDefault = false, image_size: imageSize, image_dimensions: imageDimensions, description }) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	return <Attachment>
		<Attachment.Row>
			<Attachment.Title>{title}</Attachment.Title>
			{imageSize && <Attachment.Size size={imageSize}/>}
			{collapse}
		</Attachment.Row>
		{ !collapsed && <Attachment.Content is='figure' maxWidth='480px' width='full' height='auto'>
			<Box is='img' maxWidth={imageDimensions?.width} maxHeight={imageDimensions?.height} width='full' height='auto' src={ url || `data:image/png;base64,${ imagePreview }`} display='block'></Box>
			{description && <Attachment.Details is='figcaption'>{description}</Attachment.Details>}
		</Attachment.Content> }
	</Attachment>;
};
