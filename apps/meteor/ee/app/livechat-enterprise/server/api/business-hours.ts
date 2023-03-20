import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { parseJsonQuery } from '../../../../../app/api/server/helpers/parseJsonQuery';
import { findBusinessHours } from '../business-hour/lib/business-hour';

API.v1.addRoute(
	'livechat/business-hours',
	{ authRequired: true, permissionsRequired: ['view-livechat-business-hours'] },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await parseJsonQuery(
				this.request.route,
				this.userId,
				this.queryParams as Record<string, any>,
				this.logger,
				this.queryFields,
				this.queryOperations,
			);
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
