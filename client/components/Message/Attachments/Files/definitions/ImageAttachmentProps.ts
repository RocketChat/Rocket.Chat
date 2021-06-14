import { AttachmentPropsBase } from '../../definitions/AttachmentPropsBase';
import { Dimensions } from './Dimensions';
import { FileAttachmentProps } from './FileAttachmentProps';
import { FileProp } from './FileProp';

export type ImageAttachmentProps = {
	image_dimensions?: Dimensions;
	image_preview?: string;
	image_url: string;
	image_type: string;
	image_size?: number;
	file?: FileProp;
} & AttachmentPropsBase;

export const isFileImageAttachment = (
	attachment: FileAttachmentProps,
): attachment is ImageAttachmentProps & { type: 'file' } => 'image_url' in attachment;
