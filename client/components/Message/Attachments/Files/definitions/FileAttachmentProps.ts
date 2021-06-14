import { AttachmentProps } from '../../definitions/AttachmentProps';
import { AudioAttachmentProps } from './AudioAttachmentProps';
import { FileProp } from './FileProp';
import { ImageAttachmentProps } from './ImageAttachmentProps';
import { VideoAttachmentProps } from './VideoAttachmentProps';

export type FileAttachmentProps = {
	type: 'file';
	file?: FileProp;
} & (VideoAttachmentProps | ImageAttachmentProps | AudioAttachmentProps);

export const isFileAttachment = (attachment: AttachmentProps): attachment is FileAttachmentProps =>
	'type' in attachment && attachment.type === 'file';
