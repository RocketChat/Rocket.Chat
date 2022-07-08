import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { CustomUserStatus } from '@rocket.chat/models';

import { API } from '../api';

API.v1.addRoute(
	'custom-user-status.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();

			const { cursor, totalCount } = CustomUserStatus.findPaginated(query, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
			});

			const [statuses, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				statuses,
				count: statuses.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'custom-user-status.create',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, {
				name: String,
				statusType: Match.Maybe(String),
			});

			const userStatusData = {
				name: this.bodyParams.name,
				statusType: this.bodyParams.statusType,
			};

			Meteor.call('insertOrUpdateUserStatus', userStatusData);

			const customUserStatus = await CustomUserStatus.findOneByName(userStatusData.name);
			if (!customUserStatus) {
				throw new Meteor.Error('error-creating-custom-user-status', 'Error creating custom user status');
			}

			return API.v1.success({
				customUserStatus,
			});
		},
	},
);

API.v1.addRoute(
	'custom-user-status.delete',
	{ authRequired: true },
	{
		post() {
			const { customUserStatusId } = this.bodyParams;
			if (!customUserStatusId) {
				return API.v1.failure('The "customUserStatusId" params is required!');
			}

			Meteor.call('deleteCustomUserStatus', customUserStatusId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'custom-user-status.update',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, {
				_id: String,
				name: String,
				statusType: Match.Maybe(String),
			});

			const userStatusData = {
				_id: this.bodyParams._id,
				name: this.bodyParams.name,
				statusType: this.bodyParams.statusType,
			};

			const customUserStatusToUpdate = await CustomUserStatus.findOneById(userStatusData._id);

			// Ensure the message exists
			if (!customUserStatusToUpdate) {
				return API.v1.failure(`No custom user status found with the id of "${userStatusData._id}".`);
			}

			Meteor.call('insertOrUpdateUserStatus', userStatusData);

			const customUserStatus = await CustomUserStatus.findOneById(userStatusData._id);

			if (!customUserStatus) {
				throw new Meteor.Error('error-updating-custom-user-status', 'Error updating custom user status');
			}

			return API.v1.success({
				customUserStatus,
			});
		},
	},
);
