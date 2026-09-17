import type { MessageAttachmentBase } from '../MessageAttachmentBase';
import type { FileAttachmentProps } from './FileAttachmentProps';
import type { FileProp } from './FileProp';

export type AudioTranscription = {
	status: 'pending' | 'done' | 'failed';
	text?: string;
	language?: string;
	/** Engine that produced the transcript, e.g. 'whisper-cpp-server' | 'openai-compatible' */
	provider?: string;
	ts?: Date;
	/** Short machine code, e.g. 'engine-unreachable', 'file-too-large', 'timeout' */
	error?: string;
};

export type AudioAttachmentProps = {
	audio_url: string;
	audio_type: string;
	audio_size?: number;
	file?: FileProp;
	transcription?: AudioTranscription;
} & MessageAttachmentBase;

export const isFileAudioAttachment = (attachment: FileAttachmentProps): attachment is AudioAttachmentProps & { type: 'file' } =>
	'audio_url' in attachment;
