import type { MessageAttachmentBase } from '../MessageAttachmentBase.js';
import type { FileAttachmentProps } from './FileAttachmentProps.js';
import type { FileProp } from './FileProp.js';

export type AudioAttachmentProps = {
	audio_url: string;
	audio_type: string;
	audio_size?: number;
	file?: FileProp;
} & MessageAttachmentBase;

export const isFileAudioAttachment = (attachment: FileAttachmentProps): attachment is AudioAttachmentProps & { type: 'file' } =>
	'audio_url' in attachment;
