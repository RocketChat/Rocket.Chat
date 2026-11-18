import { prependClassName } from '../../../helpers/prependClassName';

export type MessageGenericPreviewCoverImageProps = {
	url: string;
	/** Used with `height` only for the aspect ratio: the image always fills the width of its container. */
	width: number;
	/** Used with `width` only for the aspect ratio. */
	height: number;
	className?: string;
};

/**
 * An image across the width of a preview, or of a `MessageGenericPreviewThumb`, at the image's aspect ratio.
 */
const MessageGenericPreviewCoverImage = ({ url, width, height, className, ...props }: MessageGenericPreviewCoverImageProps) => (
	<div
		className={prependClassName(className, 'rcx-message-generic-preview__preview')}
		style={{ backgroundImage: `url(${url})`, maxWidth: '100%' }}
		data-testid='preview-image'
		{...props}
	>
		<div style={{ paddingTop: `${(height / width) * 100}%` }} />
	</div>
);

export default MessageGenericPreviewCoverImage;
