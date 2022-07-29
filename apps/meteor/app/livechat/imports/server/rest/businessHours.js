import { API } from '../../../../api/server';
import { findLivechatBusinessHour } from '../../../server/api/lib/businessHours';

API.v1.addRoute(
	'livechat/business-hour',
	{ authRequired: true },
	{
		get() {
			const { _id, type } = this.queryParams;
			const { businessHour } = Promise.await(findLivechatBusinessHour(this.userId, _id, type));
			return API.v1.success({
				businessHour,
			});
		},
	},
);
