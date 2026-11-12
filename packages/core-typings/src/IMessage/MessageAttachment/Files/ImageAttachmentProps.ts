import type { MessageAttachmentBase } from '../MessageAttachmentBase.js';
import type { FileAttachmentProps } from './FileAttachmentProps.js';
import type { FileProp } from './FileProp.js';

export type ImageAttachmentProps = {
	image_dimensions?: {
		width: number;
		height: number;
	};
	image_preview?: string;
	image_url: string;
	image_type?: string;
	image_size?: number;
	/** Accessibility alternative text for the image. Kept separate from `description` so it is not rendered as a visible caption. */
	image_alt?: string;
	file?: FileProp;
} & MessageAttachmentBase;

export const isFileImageAttachment = (attachment: FileAttachmentProps): attachment is ImageAttachmentProps & { type: 'file' } =>
	'image_url' in attachment;
