import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../../../../app/api/server';
import { findAllCannedResponses } from './lib/canned-responses';

API.v1.addRoute('canned-responses.get', { authRequired: true }, {
	get() {
		return API.v1.success({
			responses: Promise.await(findAllCannedResponses({ userId: this.userId })),
		});
	},
});


API.v1.addRoute('canned-responses', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			_id: Match.Maybe(String),
			shortcut: String,
			text: String,
			scope: String,
			departmentId: Match.Maybe(String),
		});
		const { _id, shortcut, text, scope, departmentId } = this.bodyParams;
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveCannedResponse', _id, { shortcut, text, scope, ...departmentId && { departmentId } });
		});
		return API.v1.success();
	},
});
