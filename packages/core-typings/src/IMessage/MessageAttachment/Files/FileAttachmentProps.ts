import type { MessageAttachmentBase } from '../MessageAttachmentBase';
import type { AudioAttachmentProps } from './AudioAttachmentProps';
import type { ImageAttachmentProps } from './ImageAttachmentProps';
import type { VideoAttachmentProps } from './VideoAttachmentProps';

export type FileAttachmentProps = {
	type: 'file';
} & (VideoAttachmentProps | ImageAttachmentProps | AudioAttachmentProps | Record<string, never>) &
	MessageAttachmentBase;

export const isFileAttachment = (attachment: MessageAttachmentBase): attachment is FileAttachmentProps =>
	'type' in attachment && (attachment as any).type === 'file';
