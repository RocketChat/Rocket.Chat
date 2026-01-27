import type { MessageAttachmentBase } from '../MessageAttachmentBase';
import type { FileProp } from './FileProp';

export type RemovedFileAttachmentProps = MessageAttachmentBase & {
	type: 'removed-file';
	fileId: FileProp['_id'];
};

export const isRemovedFileAttachment = (attachment: MessageAttachmentBase): attachment is RemovedFileAttachmentProps =>
	'type' in attachment && attachment.type === 'removed-file';
