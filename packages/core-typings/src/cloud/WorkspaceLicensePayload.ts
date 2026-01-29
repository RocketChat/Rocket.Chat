import * as z from 'zod';

import { TimestampSchema } from '../utils';

export const WorkspaceLicensePayloadSchema = z.object({
	version: z.number(),
	address: z.string(),
	license: z.string(),
	updatedAt: TimestampSchema,
	expireAt: TimestampSchema,
});

export type WorkspaceLicensePayload = z.infer<typeof WorkspaceLicensePayloadSchema>;
