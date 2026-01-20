import * as z from 'zod';

import { MessageAttachmentBaseSchema } from '../MessageAttachmentBase';
import type { FileAttachmentProps } from './FileAttachmentProps';
import { FilePropSchema } from './FileProp';

export const VideoAttachmentPropsSchema = z
	.object({
		video_url: z.string(),
		video_type: z.string(),
		video_size: z.number(),
		file: FilePropSchema.optional(),
	})
	.and(MessageAttachmentBaseSchema);

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface VideoAttachmentProps extends z.infer<typeof VideoAttachmentPropsSchema> {}

export const isFileVideoAttachment = (attachment: FileAttachmentProps): attachment is VideoAttachmentProps & { type: 'file' } =>
	VideoAttachmentPropsSchema.safeParse(attachment).success;
