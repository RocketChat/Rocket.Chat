import type { MessageAttachmentBase } from '../MessageAttachmentBase';
import type { Dimensions } from './Dimensions';
import type { FileAttachmentProps } from './FileAttachmentProps';
import type { FileProp } from './FileProp';

export type ImageAttachmentProps = {
	image_dimensions?: Dimensions;
	image_preview?: string;
	image_url: string;
	image_type: string;
	image_size?: number;
	file?: FileProp;
} & MessageAttachmentBase;

export const isFileImageAttachment = (attachment: FileAttachmentProps): attachment is ImageAttachmentProps & { type: 'file' } =>
	'image_url' in attachment;
