import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { hasPermission } from '../../../authorization';

Meteor.methods({
	'livechat:getSessionFilter'(filter = {}) {
		if (!this.userId) {
			return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:getSessionFilter' }));
		}

		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:getSessionFilter' }));
		}

		const { fromTime, toTime, valueTime } = filter;

		if (!(moment(fromTime).isValid() && moment(toTime).isValid())) {
			return this.error(new Meteor.Error('error-invalid-time', 'Invalid Time', { publish: 'livechat:sessions' }));
		}

		const query = {};
		const timeFilter = ['last-thirty-minutes', 'last-hour', 'last-six-hour', 'last-twelve-hour'];
		if (fromTime && toTime && valueTime) {
			if (timeFilter.includes(valueTime)) {
				query.createdAt = {
					$gte: moment(toTime).toDate(),
					$lt: moment(fromTime).toDate(),
				};
			} else {
				const from = moment(fromTime).add(1, 'days');
				const to = moment(toTime).add(1, 'days');
				if (moment(from).diff(to) === 0) {
					query.createdAt = {
						$gte: moment(from).utcOffset(0).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate(),
						$lt: moment(to).utcOffset(0).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).add(1, 'days').toDate(),
					};
				} else {
					query.createdAt = {
						$gte: moment(from).utcOffset(0).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate(),
						$lte: moment(to).utcOffset(0).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).toDate(),
					};
				}
			}
		}

		if (filter.name) {
			query['visitorInfo.name'] = new RegExp(filter.name, 'i');
		}
		if (filter.status) {
			query.status = filter.status;
		}

		if (filter.chatStatus) {
			query.chatStatus = filter.chatStatus;
		}

		return query;
	},
});
