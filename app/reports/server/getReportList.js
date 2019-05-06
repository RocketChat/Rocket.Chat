
import { Meteor } from 'meteor/meteor';
import { Reports } from '../../models';

export function getReportList() {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'getReportList',
		});
	}

	const reports = Reports.findAll();

	if (!reports) {
		throw new Meteor.Error('error-no-reports', 'No Reports Found', {
			method: 'getReportList',
		});
	}

	return reports;
}

Meteor.methods({
	'reports:getReportList': getReportList,
});
