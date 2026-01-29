import * as z from 'zod';

import { IBannerSchema } from '../IBanner';

export const AnnouncementSchema = IBannerSchema.extend({
	createdBy: z.enum(['cloud', 'system']),
	selector: z.object({ roles: z.array(z.string()) }).optional(),
});

export type Announcement = z.infer<typeof AnnouncementSchema>;
