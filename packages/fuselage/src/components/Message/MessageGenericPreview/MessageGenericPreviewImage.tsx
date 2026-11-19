import type { ImgHTMLAttributes } from 'react';

import { prependClassName } from '../../../helpers/prependClassName';

export type MessageGenericPreviewImageProps = {
	url: string;
	className?: string;
} & ImgHTMLAttributes<HTMLImageElement>;

/**
 * An image that is the whole preview, shown at its own size up to the preview's bounds.
 */
const MessageGenericPreviewImage = ({ url, className, ...props }: MessageGenericPreviewImageProps) => (
	<img src={url} className={prependClassName(className, 'rcx-message-generic-preview__image')} alt='' {...props} />
);

export default MessageGenericPreviewImage;
