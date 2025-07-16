import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { findBusinessHours } from '../business-hour/lib/business-hour';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/livechat/business-hours': {
			GET: (params: PaginatedRequest) => {
				businessHours: ILivechatBusinessHour[];
				count: number;
				offset: number;
				total: number;
			};
		};
	}
}

API.v1.addRoute(
	'livechat/business-hours',
	{ authRequired: true, permissionsRequired: ['view-livechat-business-hours'], license: ['livechat-enterprise'] },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { name } = this.queryParams;

			return API.v1.success(
				await findBusinessHours(
					this.userId,
					{
						offset,
						count,
						sort,
					},
					name,
				),
			);
		},
	},
);
