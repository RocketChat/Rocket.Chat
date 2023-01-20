import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { hasPermission } from '../../app/authorization/server';
import { getReportHistory } from '../lib/getReportHistory';

Meteor.methods({
	getReportHistory({ latest, oldest, offset = 0, count = 20 }) {
		const fromUserId = Meteor.userId();

		if (!fromUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getReportHistory',
			});
		}

		// Ensure user has permission to view the moderation console.
		if (!hasPermission(fromUserId, 'view-moderation-console')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getReportHistory',
			});
		}

		// Ensure latest is always defined.
		if (_.isUndefined(latest)) {
			latest = new Date();
		}

		if (!_.isUndefined(oldest) && !_.isDate(oldest)) {
			throw new Meteor.Error('error-invalid-date', 'Invalid date', {
				method: 'getReportHistory',
			});
		}

		// const options: Record<string, unknown> = {
		//     sort: {
		//         ts: -1,
		//     },
		//     skip: offset,
		//     limit: count,
		// };

		const reports = getReportHistory({ latest, oldest, offset, count });

		return reports;
	},
});
