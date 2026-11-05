import type { MessageAttachmentBase } from '../MessageAttachmentBase.js';
import type { FileAttachmentProps } from './FileAttachmentProps.js';
import type { FileProp } from './FileProp.js';

export type VideoAttachmentProps = {
	video_url: string;
	video_type: string;
	video_size: number;
	file?: FileProp;
} & MessageAttachmentBase;

export const isFileVideoAttachment = (attachment: FileAttachmentProps): attachment is VideoAttachmentProps & { type: 'file' } =>
	'video_url' in attachment;
