import type { MessageAttachmentBase } from '../MessageAttachmentBase.js';
import type { AudioAttachmentProps } from './AudioAttachmentProps.js';
import type { FileProp } from './FileProp.js';
import type { ImageAttachmentProps } from './ImageAttachmentProps.js';
import type { VideoAttachmentProps } from './VideoAttachmentProps.js';

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
