import * as z from 'zod';

import { MessageAttachmentBaseSchema } from '../MessageAttachmentBase';
import type { FileAttachmentProps } from './FileAttachmentProps';
import { FilePropSchema } from './FileProp';

export const ImageAttachmentPropsSchema = z
	.object({
		image_dimensions: z
			.object({
				width: z.number(),
				height: z.number(),
			})
			.optional(),
		image_preview: z.string().optional(),
		image_url: z.string(),
		image_type: z.string().optional(),
		image_size: z.number().optional(),
		file: FilePropSchema.optional(),
	})
	.and(MessageAttachmentBaseSchema);

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ImageAttachmentProps extends z.infer<typeof ImageAttachmentPropsSchema> {}

export const isFileImageAttachment = (attachment: FileAttachmentProps): attachment is ImageAttachmentProps & { type: 'file' } =>
	ImageAttachmentPropsSchema.safeParse(attachment).success;
