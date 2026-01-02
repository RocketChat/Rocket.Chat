import * as z from 'zod';

export const IRoleSchema = z.object({
	_id: z.string(),
	description: z.string(),
	mandatory2fa: z.boolean().optional(),
	name: z.string(),
	protected: z.boolean(),
	scope: z.enum(['Users', 'Subscriptions']),
});

export interface IRole extends z.infer<typeof IRoleSchema> {}
