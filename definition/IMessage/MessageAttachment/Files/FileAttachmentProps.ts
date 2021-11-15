
import { MessageAttachmentBase } from '../MessageAttachmentBase';
import { AudioAttachmentProps } from './AudioAttachmentProps';
import { FileProp } from './FileProp';
import { ImageAttachmentProps } from './ImageAttachmentProps';
import { VideoAttachmentProps } from './VideoAttachmentProps';
import { PDFAttachmentProps } from './PDFAttachmentProps';

export type FileAttachmentProps = {
	type: 'file';
	file?: FileProp;
} & (VideoAttachmentProps | ImageAttachmentProps | AudioAttachmentProps | PDFAttachmentProps);

export const isFileAttachment = (attachment: MessageAttachmentBase): attachment is FileAttachmentProps =>
	'type' in attachment && (attachment as any).type === 'file';
