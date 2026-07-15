import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import {
	ajv,
	ajvQuery,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../../server/api';
import { getPaginationItems } from '../../../../../server/api/lib/getPaginationItems';
import { findBusinessHours } from '../../../lib/omnichannel/business-hour/lib/business-hour';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/livechat/business-hours': {
			GET: (params: PaginatedRequest<{ name?: string }>) => {
				businessHours: ILivechatBusinessHour[];
				count: number;
				offset: number;
				total: number;
			};
		};
	}
}

const businessHoursQueryValidator = ajvQuery.compile<PaginatedRequest<{ name?: string }>>({
	type: 'object',
	properties: {
		count: { type: 'number' },
		offset: { type: 'number' },
		sort: { type: 'string' },
		query: { type: 'string' },
		name: { type: 'string' },
	},
	additionalProperties: false,
});

const businessHoursResponseSchema = ajv.compile<{
	businessHours: ILivechatBusinessHour[];
	count: number;
	offset: number;
	total: number;
}>({
	type: 'object',
	properties: {
		businessHours: { type: 'array', items: { $ref: '#/components/schemas/ILivechatBusinessHour' } },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['businessHours', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'livechat/business-hours',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-business-hours'],
		license: ['livechat-enterprise'],
		query: businessHoursQueryValidator,
		response: {
			200: businessHoursResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();
		const { name } = this.queryParams;

		return API.v1.success({
			...(await findBusinessHours(
				this.userId,
				{
					offset,
					count,
					sort,
				},
				name,
			)),
		});
	},
);
