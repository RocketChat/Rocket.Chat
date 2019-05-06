import { Meteor } from 'meteor/meteor';
import { getReportList } from '../../app/reports/server/getReportList';

Meteor.publish('reports', function() {
	if (!this.userId) {
		return this.ready();
	}

	const result = getReportList();

	if (!result) {
		return this.ready();
	}

	return result;
});
