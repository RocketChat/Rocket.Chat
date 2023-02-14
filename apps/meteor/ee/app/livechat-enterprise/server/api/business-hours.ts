import { API } from '../../../../../app/api/server';
import { findBusinessHours } from '../business-hour/lib/business-hour';

API.v1.addRoute(
	'livechat/business-hours',
	{ authRequired: true, permissionsRequired: ['view-livechat-business-hours'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
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
