import { IOAuthAppsSchema, IUserSchema } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';

export const GETOAuthAppsListQuerySchema = z.object({
	uid: IUserSchema.shape._id.optional(),
});

export const GETOAuthAppsListResponseSchema = SuccessResponseSchema.extend({
	oauthApps: z.array(IOAuthAppsSchema),
});

export const POSTOAuthAppsDeleteBodySchema = z.object({
	appId: z.string(),
});

export const POSTOAuthAppsDeleteResponseSchema = z.boolean();

export const POSTOAuthAppsCreateBodySchema = z.object({
	name: z.string(),
	active: z.boolean(),
	redirectUri: z.string(),
});

export const POSTOAuthAppsCreateResponseSchema = SuccessResponseSchema.extend({
	application: IOAuthAppsSchema,
});

export const POSTOAuthAppsUpdateBodySchema = z.object({
	appId: z.string(),
	name: z.string(),
	active: z.boolean(),
	clientId: z.string().optional(),
	clientSecret: z.string().optional(),
	redirectUri: z.string(),
});

export const POSTOAuthAppsUpdateResponseSchema = z.union([SuccessResponseSchema.and(IOAuthAppsSchema), z.null()]);

export const GETOAuthAppsGetQuerySchema = z.union(
	[
		z.object({
			_id: IOAuthAppsSchema.shape._id,
		}),
		z.object({
			clientId: z.string(),
		}),
	],
	{ inclusive: false },
);

export const GETOAuthAppsGetResponseSchema = SuccessResponseSchema.extend({
	oauthApp: IOAuthAppsSchema,
});
