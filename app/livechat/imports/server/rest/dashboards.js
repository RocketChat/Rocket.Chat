import { check } from 'meteor/check';

import { API } from '../../../../api';
import { Livechat } from '../../../server/lib/Livechat';
import { hasPermission } from '../../../../authorization/server';

API.v1.addRoute('livechat/analytics/dashboards/conversation-totalizers', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}
		let { start, end } = this.requestParams();

		check(start, String);
		check(end, String);

		if (isNaN(Date.parse(start))) {
			return API.v1.failure('The "start" query parameter must be a valid date.');
		}
		start = new Date(start);

		if (isNaN(Date.parse(end))) {
			return API.v1.failure('The "end" query parameter must be a valid date.');
		}
		end = new Date(end);

		const totalizers = Livechat.Analytics.getAnalyticsOverviewData({
			daterange: {
				from: start,
				to: end,
			},
			analyticsOptions: {
				name: 'Conversations',
			},
		});

		return API.v1.success({
			totalizers,
		});
	},
});
