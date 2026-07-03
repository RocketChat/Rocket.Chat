import * as z from 'zod';

import { IBannerSchema } from '../IBanner';
import { TimestampSchema } from '../utils';

export const AnnouncementSchema = IBannerSchema.extend({
	createdBy: z.enum(['cloud', 'system']),
	_updatedAt: TimestampSchema.optional(),
	selector: z.object({ roles: z.array(z.string()) }).optional(),
});

export type Announcement = z.infer<typeof AnnouncementSchema>;
