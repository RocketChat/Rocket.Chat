import { IPermissionSchema } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';

export const GETPermissionsListAllQuerySchema = z.object({
	updatedSince: z.string().optional(),
});

export const GETPermissionsListAllResponseSchema = SuccessResponseSchema.extend({
	update: z.array(IPermissionSchema),
	remove: z.array(IPermissionSchema),
});

export const POSTPermissionsUpdateBodySchema = z.object({
	permissions: z.array(IPermissionSchema.pick({ _id: true, roles: true })),
});

export const POSTPermissionsUpdateResponseSchema = SuccessResponseSchema.extend({
	permissions: z.array(IPermissionSchema),
});
