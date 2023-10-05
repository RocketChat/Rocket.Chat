import { Presence } from '@rocket.chat/core-services';
import { Statistics } from '@rocket.chat/models';

import { API } from '../api';

API.v1.addRoute(
	'presence.getConnections',
	{ authRequired: true, permissionsRequired: ['manage-user-status'] },
	{
		async get() {
			const result = await Presence.getConnectionCount();

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'presence.getMonthlyPeakConnections',
	{ authRequired: true, permissionsRequired: ['manage-user-status'] },
	{
		async get() {
			const maxMonthlyPeakConnections = await Statistics.findMonthlyPeakConnections();
			const { peak: currentDailyPeakConnections, max } = await Presence.getDailyPeakConnections();
			if (!maxMonthlyPeakConnections || currentDailyPeakConnections > maxMonthlyPeakConnections.dailyPeakConnections) {
				return API.v1.success({
					peak: currentDailyPeakConnections,
					date: new Date(),
					max,
				});
			}

			return API.v1.success({
				peak: maxMonthlyPeakConnections.dailyPeakConnections,
				date: maxMonthlyPeakConnections.createdAt,
				max,
			});
		},
	},
);

API.v1.addRoute(
	'presence.enableBroadcast',
	{ authRequired: true, permissionsRequired: ['manage-user-status'], twoFactorRequired: true },
	{
		async post() {
			await Presence.toggleBroadcast(true);

			return API.v1.success();
		},
	},
);
