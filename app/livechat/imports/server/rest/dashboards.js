import { check } from 'meteor/check';

import { API } from '../../../../api';
import { Livechat } from '../../../server/lib/Livechat';
import { hasPermission } from '../../../../authorization/server';
import { findAllNumberOfAbandonedRooms } from '../../../server/lib/analytics/departments';

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
		const metrics = ['Total_conversations', 'Open_conversations', 'Total_messages', 'Busiest_time'];
		const abandonedRooms = findAllNumberOfAbandonedRooms({
			start,
			end,
		});
		const totalAbandonedRooms = abandonedRooms.departments.reduce((acc, item) => {
			acc += item.abandonedRooms;
			return acc;
		}, 0);
		return API.v1.success({
			totalizers: [...totalizers.filter((metric) => metrics.includes(metric.title)), { title: 'Total_abandoned_chats', value: totalAbandonedRooms }],
		});
	},
});
