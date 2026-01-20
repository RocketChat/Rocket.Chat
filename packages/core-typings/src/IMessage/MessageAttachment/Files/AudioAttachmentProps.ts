import * as z from 'zod';

import { MessageAttachmentBaseSchema } from '../MessageAttachmentBase';
import type { FileAttachmentProps } from './FileAttachmentProps';
import { FilePropSchema } from './FileProp';

export const AudioAttachmentPropsSchema = z
	.object({
		audio_url: z.string(),
		audio_type: z.string(),
		audio_size: z.number().optional(),
		file: FilePropSchema.optional(),
	})
	.and(MessageAttachmentBaseSchema);

export type AudioAttachmentProps = z.infer<typeof AudioAttachmentPropsSchema>;

export const isFileAudioAttachment = (attachment: FileAttachmentProps): attachment is AudioAttachmentProps & { type: 'file' } =>
	'audio_url' in attachment;
