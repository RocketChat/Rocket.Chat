import { check } from 'meteor/check';

import { API } from '../../../../api';
import { Livechat } from '../../../server/lib/Livechat';
import { hasPermission } from '../../../../authorization/server';
import {
	findAllNumberOfAbandonedRooms,
	findPercentageOfAbandonedRooms,
	findAllAverageServiceTime,
	findAllAverageWaitingTime,
} from '../../../server/lib/analytics/departments';
import { secondsToHHMMSS } from '../../../../utils/server';

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


API.v1.addRoute('livechat/analytics/dashboards/productivity-totalizers', { authRequired: true }, {
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
				name: 'Productivity',
			},
		});

		const averageOfAbandonedRooms = findPercentageOfAbandonedRooms({
			start,
			end,
		});
		const averageServiceTime = findAllAverageServiceTime({
			start,
			end,
		});
		const averageWaitingTime = findAllAverageWaitingTime({
			start,
			end,
		});
		const totalOfAbandonedRooms = averageOfAbandonedRooms.departments.length;
		const totalOfServiceTime = averageServiceTime.departments.length;
		const totalOfWaitingTime = averageWaitingTime.departments.length;
		const sumOfPercentageOfAbandonedRooms = averageOfAbandonedRooms.departments.reduce((acc, abandonedRoom) => {
			acc += abandonedRoom.percentageOfAbandonedChats;
			return acc;
		}, 0);
		const sumOfServiceTime = averageServiceTime.departments.reduce((acc, serviceTime) => {
			acc += serviceTime.averageServiceTimeInSeconds;
			return acc;
		}, 0);
		const sumOfWaitingTime = averageWaitingTime.departments.reduce((acc, serviceTime) => {
			acc += serviceTime.averageWaitingTimeInSeconds;
			return acc;
		}, 0);
		const totalOfAverageAbandonedRooms = totalOfAbandonedRooms === 0 ? 0 : sumOfPercentageOfAbandonedRooms / totalOfAbandonedRooms;
		const totalOfAverageServiceTime = totalOfServiceTime === 0 ? 0 : sumOfServiceTime / totalOfServiceTime;
		const totalOfAvarageWaitingTime = totalOfWaitingTime === 0 ? 0 : sumOfWaitingTime / totalOfWaitingTime;

		return API.v1.success({
			totalizers: [
				...totalizers,
				{ title: 'Avg_of_abandoned_chats', value: `${ totalOfAverageAbandonedRooms }%` },
				{ title: 'Avg_of_service_time', value: secondsToHHMMSS(totalOfAverageServiceTime) },
				{ title: 'Avg_of_waiting_time', value: secondsToHHMMSS(totalOfAvarageWaitingTime) },
			],
		});
	},
});
