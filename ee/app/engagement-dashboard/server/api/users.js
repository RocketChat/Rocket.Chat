import { check } from 'meteor/check';

import { API } from '../../../../../server/api';
import {
	findWeeklyUsersRegisteredData,
	findActiveUsersMonthlyData,
	findBusiestsChatsInADayByHours,
	findBusiestsChatsWithinAWeek,
	findUserSessionsByHourWithinAWeek,
} from '../lib/users';
import { transformDatesForAPI } from './helpers/date';

API.v1.addRoute('engagement-dashboard/users/new-users', { authRequired: true }, {
	get() {
		const { start, end } = this.requestParams();

		check(start, String);
		check(end, String);

		const data = Promise.await(findWeeklyUsersRegisteredData(transformDatesForAPI(start, end)));
		return API.v1.success(data);
	},
});

API.v1.addRoute('engagement-dashboard/users/active-users', { authRequired: true }, {
	get() {
		const { start, end } = this.requestParams();

		check(start, String);
		check(end, String);

		const data = Promise.await(findActiveUsersMonthlyData(transformDatesForAPI(start, end)));
		return API.v1.success(data);
	},
});

API.v1.addRoute('engagement-dashboard/users/chat-busier/hourly-data', { authRequired: true }, {
	get() {
		const { start } = this.requestParams();

		const data = Promise.await(findBusiestsChatsInADayByHours(transformDatesForAPI(start)));
		return API.v1.success(data);
	},
});

API.v1.addRoute('engagement-dashboard/users/chat-busier/weekly-data', { authRequired: true }, {
	get() {
		const { start } = this.requestParams();

		check(start, String);

		const data = Promise.await(findBusiestsChatsWithinAWeek(transformDatesForAPI(start)));
		return API.v1.success(data);
	},
});

API.v1.addRoute('engagement-dashboard/users/users-by-time-of-the-day-in-a-week', { authRequired: true }, {
	get() {
		const { start, end } = this.requestParams();

		check(start, String);
		check(end, String);

		const data = Promise.await(findUserSessionsByHourWithinAWeek(transformDatesForAPI(start, end)));
		return API.v1.success(data);
	},
});
