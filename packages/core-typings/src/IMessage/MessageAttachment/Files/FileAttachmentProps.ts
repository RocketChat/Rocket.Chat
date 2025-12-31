import * as z from 'zod';

import { MessageAttachmentBaseSchema, type MessageAttachmentBase } from '../MessageAttachmentBase';
import { AudioAttachmentPropsSchema } from './AudioAttachmentProps';
import { ImageAttachmentPropsSchema } from './ImageAttachmentProps';
import { VideoAttachmentPropsSchema } from './VideoAttachmentProps';

export const FileAttachmentPropsSchema = z.union([
	z.object({ type: z.literal('file') }).and(MessageAttachmentBaseSchema),
	z.object({ type: z.literal('file') }).and(AudioAttachmentPropsSchema),
	z.object({ type: z.literal('file') }).and(ImageAttachmentPropsSchema),
	z.object({ type: z.literal('file') }).and(VideoAttachmentPropsSchema),
]);

export type FileAttachmentProps = z.infer<typeof FileAttachmentPropsSchema>;

export const isFileAttachment = (attachment: MessageAttachmentBase): attachment is FileAttachmentProps =>
	FileAttachmentPropsSchema.safeParse(attachment).success;
