import { isGETBusinessHourParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { findLivechatBusinessHour } from '../../../server/api/lib/businessHours';

API.v1.addRoute(
	'livechat/business-hour',
	{ authRequired: true, permissionsRequired: ['view-livechat-business-hours'], validateParams: isGETBusinessHourParams },
	{
		async get() {
			const { _id, type } = this.queryParams;
			const { businessHour } = await findLivechatBusinessHour(_id, type);
			return API.v1.success({
				businessHour,
			});
		},
	},
);
