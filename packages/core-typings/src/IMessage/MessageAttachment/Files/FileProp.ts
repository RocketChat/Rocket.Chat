import * as z from 'zod';

export const FilePropSchema = z.object({
	_id: z.string(),
	name: z.string(),
	type: z.string(),
	format: z.string(),
	size: z.number(),
	typeGroup: z.string().optional(), // used to filter out thumbnails in email notifications; may not exist in old messages
});

export type FileProp = z.infer<typeof FilePropSchema>;
