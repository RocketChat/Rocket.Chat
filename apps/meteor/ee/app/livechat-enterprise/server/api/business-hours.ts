import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { findBusinessHours } from '../business-hour/lib/business-hour';

API.v1.addRoute(
	'livechat/business-hours',
	{ authRequired: true, permissionsRequired: ['view-livechat-business-hours'] },
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
