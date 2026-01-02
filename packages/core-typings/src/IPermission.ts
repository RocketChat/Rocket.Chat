import * as z from 'zod';

import { IRocketChatRecordSchema } from './IRocketChatRecord';

export const IPermissionSchema = IRocketChatRecordSchema.extend({
	roles: z.array(z.string()),
	group: z.string().nullish(),
	groupPermissionId: z.string().optional(),
	level: z.literal('settings').optional(),
	section: z.string().nullish(),
	sectionPermissionId: z.string().optional(),
	settingId: z.string().optional(),
	sorter: z.number().optional(),
});

export interface IPermission extends z.infer<typeof IPermissionSchema> {}
