import { CustomUserStatus } from '@rocket.chat/models';
import { isCustomUserStatusListProps } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { deleteCustomUserStatus } from '../../../user-status/server/methods/deleteCustomUserStatus';
import { insertOrUpdateUserStatus } from '../../../user-status/server/methods/insertOrUpdateUserStatus';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'custom-user-status.list',
	{ authRequired: true, validateParams: isCustomUserStatusListProps },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
			const { sort, query } = await this.parseJsonQuery();

			const { name, _id } = this.queryParams;

			const filter = {
				...query,
				...(name ? { name: { $regex: escapeRegExp(name as string), $options: 'i' } } : {}),
				...(_id ? { _id } : {}),
			};

			const { cursor, totalCount } = CustomUserStatus.findPaginated(filter, {
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
				statusType: this.bodyParams.statusType || '',
			};

			await insertOrUpdateUserStatus(this.userId, userStatusData);

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

			await deleteCustomUserStatus(this.userId, customUserStatusId);

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

			await insertOrUpdateUserStatus(this.userId, userStatusData);

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
