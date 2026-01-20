import * as z from 'zod';

import { serializableDate } from './utils';

export const ICustomSoundSchema = z.object({
	_id: z.string(),
	name: z.string(),
	extension: z.string(),
	src: z.string().optional(),
	random: z.unknown().optional(),
	_updatedAt: serializableDate.optional(),
});

export interface ICustomSound extends z.infer<typeof ICustomSoundSchema> {}
