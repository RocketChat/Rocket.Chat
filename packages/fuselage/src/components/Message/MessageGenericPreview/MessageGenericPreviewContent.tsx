import type { ReactNode } from 'react';

export type MessageGenericPreviewContentProps = {
	children?: ReactNode;
	/** Shown before the text, such as a `MessageGenericPreviewThumb` or a `MessageGenericPreviewIcon`. */
	thumb?: ReactNode;
};

/**
 * The text of a preview: its title, description and footer.
 */
const MessageGenericPreviewContent = ({ thumb, ...props }: MessageGenericPreviewContentProps) => (
	<div className='rcx-message-generic-preview__content'>
		{thumb}
		<div className='rcx-message-generic-preview__content-wrapper' {...props} />
	</div>
);

export default MessageGenericPreviewContent;
