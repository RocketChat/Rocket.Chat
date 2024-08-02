import type { MessageAttachmentBase } from '../MessageAttachmentBase';
import type { AudioAttachmentProps } from './AudioAttachmentProps';
import type { ImageAttachmentProps } from './ImageAttachmentProps';
import type { VideoAttachmentProps } from './VideoAttachmentProps';

export type FileAttachmentProps =
	| ({ type: 'file' } & VideoAttachmentProps)
	| ({ type: 'file' } & ImageAttachmentProps)
	| ({ type: 'file' } & AudioAttachmentProps)
	| ({ type: 'file' } & MessageAttachmentBase);

export const isFileAttachment = (attachment: MessageAttachmentBase): attachment is FileAttachmentProps =>
	'type' in attachment && (attachment as any).type === 'file';
