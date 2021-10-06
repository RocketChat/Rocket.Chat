
import { MessageAttachmentBase } from '../MessageAttachmentBase';
import { AudioAttachmentProps } from './AudioAttachmentProps';
import { FileProp } from './FileProp';
import { ImageAttachmentProps } from './ImageAttachmentProps';
import { VideoAttachmentProps } from './VideoAttachmentProps';

export type FileAttachmentProps = {
	type: 'file';
	file?: FileProp;
} & (VideoAttachmentProps | ImageAttachmentProps | AudioAttachmentProps);

export const isFileAttachment = (attachment: MessageAttachmentBase): attachment is FileAttachmentProps =>
	'type' in attachment && (attachment as any).type === 'file';
