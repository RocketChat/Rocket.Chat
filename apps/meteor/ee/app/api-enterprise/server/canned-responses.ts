import { Meteor } from 'meteor/meteor';
import { isPOSTCannedResponsesProps, isDELETECannedResponsesProps, isCannedResponsesProps } from '@rocket.chat/rest-typings';

import { API } from '../../../../app/api/server';
import { findAllCannedResponses, findAllCannedResponsesFilter, findOneCannedResponse } from './lib/canned-responses';

API.v1.addRoute(
	'canned-responses.get',
	{ authRequired: true, permissionsRequired: ['view-canned-responses'] },
	{
		async get() {
			return API.v1.success({
				responses: await findAllCannedResponses({ userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'canned-responses',
	{
		authRequired: true,
		permissionsRequired: { GET: ['view-canned-responses'], POST: ['save-canned-responses'], DELETE: ['remove-canned-responses'] },
		validateParams: { POST: isPOSTCannedResponsesProps, DELETE: isDELETECannedResponsesProps, GET: isCannedResponsesProps },
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields } = this.parseJsonQuery();
			const { shortcut, text, scope, tags, departmentId, createdBy } = this.requestParams();
			const { cannedResponses, total } = await findAllCannedResponsesFilter({
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
			});
			return API.v1.success({
				cannedResponses,
				count: cannedResponses.length,
				offset,
				total,
			});
		},
		async post() {
			const { _id, shortcut, text, scope, departmentId, tags } = this.bodyParams;
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveCannedResponse', _id, {
					shortcut,
					text,
					scope,
					...(tags && { tags }),
					...(departmentId && { departmentId }),
				});
			});
			return API.v1.success();
		},
		async delete() {
			const { _id } = this.requestParams();
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('removeCannedResponse', _id);
			});
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'canned-responses/:_id',
	{ authRequired: true, permissionsRequired: ['view-canned-responses'] },
	{
		async get() {
			const { _id } = this.urlParams;
			const cannedResponse = await findOneCannedResponse({
				userId: this.userId,
				_id,
			});

			if (!cannedResponse) {
				return API.v1.notFound();
			}

			return API.v1.success({ cannedResponse });
		},
	},
);
