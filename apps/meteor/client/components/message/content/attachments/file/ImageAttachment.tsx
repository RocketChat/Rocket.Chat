import type { ImageAttachmentProps } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';

import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';
import AttachmentImage from '../structure/AttachmentImage';
import { useLoadImage } from './hooks/useLoadImage';

const ImageAttachment = ({
	id,
	title,
	image_url: url,
	image_preview: imagePreview,
	image_size: size,
	image_dimensions: imageDimensions = {
		width: 368,
		height: 368,
	},
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	collapsed,
}: ImageAttachmentProps) => {
	const [loadImage, setLoadImage] = useLoadImage();
	const getURL = useMediaUrl();

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<AttachmentImage
					{...imageDimensions}
					loadImage={loadImage}
					setLoadImage={setLoadImage}
					dataSrc={getURL(link || url)}
					src={getURL(url)}
					previewUrl={`data:image/png;base64,${imagePreview}`}
					id={id}
				/>
			</MessageCollapsible>
		</>
	);
};

export default ImageAttachment;
