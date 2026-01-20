import {
	ForbiddenErrorResponseSchema,
	NotFoundErrorResponseSchema,
	SuccessResponseSchema,
	UnauthorizedErrorResponseSchema,
} from '@rocket.chat/rest-typings';
import * as z from 'zod';

import type { AppsRestApi } from '../rest';

const GETAppsIdLogsDistinctValuesResponseSchema = SuccessResponseSchema.extend({
	instanceIds: z.array(z.string()),
	methods: z.array(z.string()),
});

export const registerAppLogsDistinctInstanceHandler = ({ api, _orch }: AppsRestApi) =>
	void api.get(
		':id/logs/distinctValues',
		{
			authRequired: true,
			permissionsRequired: ['manage-apps'],
			response: {
				200: GETAppsIdLogsDistinctValuesResponseSchema,
				401: UnauthorizedErrorResponseSchema,
				403: ForbiddenErrorResponseSchema,
				404: NotFoundErrorResponseSchema,
			},
		},
		async function action() {
			const app = await _orch.getManager()?.getOneById(this.urlParams.id);

			if (!app) {
				return api.notFound(`No app found with id: ${this.urlParams.id}`);
			}

			const result = await _orch.getLogStorage().distinctValues(this.urlParams.id);

			return api.success(result);
		},
	);
