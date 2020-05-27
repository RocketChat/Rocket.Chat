import { check } from 'meteor/check';

import { API } from '../../../../../server/api';
import { findWeeklyMessagesSentData, findMessagesSentOrigin, findTopFivePopularChannelsByMessageSentQuantity } from '../lib/messages';
import { transformDatesForAPI } from './helpers/date';

API.v1.addRoute('engagement-dashboard/messages/messages-sent', { authRequired: true }, {
	get() {
		const { start, end } = this.requestParams();

		check(start, String);
		check(end, String);

		const data = Promise.await(findWeeklyMessagesSentData(transformDatesForAPI(start, end)));
		return API.v1.success(data);
	},
});

API.v1.addRoute('engagement-dashboard/messages/origin', { authRequired: true }, {
	get() {
		const { start, end } = this.requestParams();

		check(start, String);
		check(end, String);

		const data = Promise.await(findMessagesSentOrigin(transformDatesForAPI(start, end)));
		return API.v1.success(data);
	},
});

API.v1.addRoute('engagement-dashboard/messages/top-five-popular-channels', { authRequired: true }, {
	get() {
		const { start, end } = this.requestParams();

		check(start, String);
		check(end, String);

		const data = Promise.await(findTopFivePopularChannelsByMessageSentQuantity(transformDatesForAPI(start, end)));
		return API.v1.success(data);
	},
});
