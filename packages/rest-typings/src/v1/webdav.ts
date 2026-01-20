import { IWebdavAccountIntegrationSchema, IWebdavAccountSchema } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';

export const GETWebdavGetMyAccountsResponseSchema = SuccessResponseSchema.extend({
	accounts: z.array(IWebdavAccountIntegrationSchema),
});

export const POSTWebdavRemoveWebdavAccountBodySchema = z.object({
	accountId: IWebdavAccountSchema.shape._id,
});

export const POSTWebdavRemoveWebdavAccountResponseSchema = SuccessResponseSchema.extend({
	result: z.object({
		acknowledged: z.boolean(),
		deletedCount: z.number(),
	}),
});
