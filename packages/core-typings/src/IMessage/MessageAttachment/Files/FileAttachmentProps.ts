import type { MessageAttachmentBase } from '../MessageAttachmentBase';
import type { AudioAttachmentProps } from './AudioAttachmentProps';
import type { FileProp } from './FileProp';
import type { ImageAttachmentProps } from './ImageAttachmentProps';
import type { VideoAttachmentProps } from './VideoAttachmentProps';

type CommonFileProps = {
	type: 'file';
	fileId?: FileProp['_id'];
};

export type FileAttachmentProps =
	| (CommonFileProps & VideoAttachmentProps)
	| (CommonFileProps & ImageAttachmentProps)
	| (CommonFileProps & AudioAttachmentProps)
	| (CommonFileProps & MessageAttachmentBase);

export const isFileAttachment = (attachment: MessageAttachmentBase): attachment is FileAttachmentProps =>
	'type' in attachment && (attachment as any).type === 'file';
