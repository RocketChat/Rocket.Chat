import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../../../../app/api/server';
import { findAllCannedResponses, findAllCannedResponsesFilter, findOneCannedResponse } from './lib/canned-responses';

API.v1.addRoute('canned-responses.get', { authRequired: true }, {
	get() {
		return API.v1.success({
			responses: Promise.await(findAllCannedResponses({ userId: this.userId })),
		});
	},
});


API.v1.addRoute('canned-responses', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields } = this.parseJsonQuery();
		const { shortcut, text, scope, tags, departmentId, createdBy } = this.requestParams();
		check(shortcut, Match.Maybe(String));
		check(text, Match.Maybe(String));
		check(tags, Match.Maybe([String]));
		const { cannedResponses, total } = Promise.await(findAllCannedResponsesFilter({
			shortcut,
			text,
			scope,
			tags,
			departmentId,
			userId: this.userId,
			createdBy,
			options: {
				sort,
				offset,
				count,
				fields,
			},
		}));
		return API.v1.success({
			cannedResponses,
			count: cannedResponses.length,
			offset,
			total,
		});
	},
	post() {
		check(this.bodyParams, {
			_id: Match.Maybe(String),
			shortcut: String,
			text: String,
			scope: String,
			tags: Match.Maybe([String]),
			departmentId: Match.Maybe(String),
		});
		const { _id, shortcut, text, scope, departmentId, tags } = this.bodyParams;
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveCannedResponse', _id, {
				shortcut,
				text,
				scope,
				...tags && { tags },
				...departmentId && { departmentId },
			});
		});
		return API.v1.success();
	},
	delete() {
		const { _id } = this.requestParams();
		check(_id, String);
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('removeCannedResponse', _id);
		});
		return API.v1.success();
	},
});

API.v1.addRoute('canned-responses/:_id', { authRequired: true }, {
	get() {
		const { _id } = this.urlParams;
		check(_id, String);

		const cannedResponse = Promise.await(findOneCannedResponse({
			userId: this.userId,
			_id,
		}));

		return API.v1.success({ cannedResponse });
	},
});
