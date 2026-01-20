import type { IAuditServerActor, IServerEventSettingsChanged } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';
import { PaginatedRequestSchema } from '../helpers/PaginatedRequest';
import { PaginatedResultSchema } from '../helpers/PaginatedResult';

export const GETAuditSettingsQuerySchema = z
	.object({
		start: z.string().nullish(),
		end: z.string().nullish(),
		settingId: z.string().nullish(),
		actor: z.custom<IAuditServerActor>().nullish(),
	})
	.and(PaginatedRequestSchema);

export const GETAuditSettingsResponseSchema = SuccessResponseSchema.extend({
	events: z.array(z.custom<IServerEventSettingsChanged>()),
}).and(PaginatedResultSchema);

export type ServerEventsAuditSettingsParamsGET = z.infer<typeof GETAuditSettingsQuerySchema>;

export type ServerEventsEndpoints = {
	'/v1/audit.settings': {
		GET: (params: z.infer<typeof GETAuditSettingsQuerySchema>) => z.infer<typeof GETAuditSettingsResponseSchema>;
	};
};
