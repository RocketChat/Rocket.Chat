import { API } from '../../../../api/server';
import { findLivechatBusinessHour } from '../../../server/api/lib/businessHours';

API.v1.addRoute(
	'livechat/business-hour',
	{ authRequired: true, permissionsRequired: ['view-livechat-business-hours'] },
	{
		get() {
			const { _id, type } = this.queryParams;
			const { businessHour } = Promise.await(findLivechatBusinessHour(_id, type));
			return API.v1.success({
				businessHour,
			});
		},
	},
);
