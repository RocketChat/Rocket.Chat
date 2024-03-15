import { CustomUserStatus } from '@rocket.chat/models';
import { isCustomUserStatusCreateProps, isCustomUserStatusUpdateProps } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'custom-user-status.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, query } = await this.parseJsonQuery();

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
	{ authRequired: true, validateParams: isCustomUserStatusCreateProps },
	{
		async post() {
			const userStatusData = {
				name: this.bodyParams.name,
				statusType: this.bodyParams.statusType,
			};

			await Meteor.callAsync('insertOrUpdateUserStatus', userStatusData);

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
		async post() {
			const { customUserStatusId } = this.bodyParams;
			if (!customUserStatusId) {
				return API.v1.failure('The "customUserStatusId" params is required!');
			}

			await Meteor.callAsync('deleteCustomUserStatus', customUserStatusId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'custom-user-status.update',
	{ authRequired: true, validateParams: isCustomUserStatusUpdateProps },
	{
		async post() {
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

			await Meteor.callAsync('insertOrUpdateUserStatus', userStatusData);

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
