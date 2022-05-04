import type { MessageAttachmentBase } from '../MessageAttachmentBase';
import type { AudioAttachmentProps } from './AudioAttachmentProps';
import type { FileProp } from './FileProp';
import type { ImageAttachmentProps } from './ImageAttachmentProps';
import type { VideoAttachmentProps } from './VideoAttachmentProps';

export type FileAttachmentProps = {
	type: 'file';
	file?: FileProp;
} & (VideoAttachmentProps | ImageAttachmentProps | AudioAttachmentProps);

export const isFileAttachment = (attachment: MessageAttachmentBase): attachment is FileAttachmentProps =>
	'type' in attachment && (attachment as any).type === 'file';
