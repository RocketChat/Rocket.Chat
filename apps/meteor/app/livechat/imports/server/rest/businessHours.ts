import { Settings } from '@rocket.chat/models';
import { isGETBusinessHourParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { findLivechatBusinessHour } from '../../../server/api/lib/businessHours';

API.v1.addRoute(
	'livechat/business-hour',
	{ authRequired: true, permissionsRequired: ['view-livechat-business-hours'], validateParams: isGETBusinessHourParams },
	{
		async get() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
			const { _id, type } = this.queryParams;
			const { businessHour } = await findLivechatBusinessHour(_id, type);
			return API.v1.success({
				businessHour,
			});
		},
	},
);
