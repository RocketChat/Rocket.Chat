import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { CustomUserStatus } from '../../../models';
import { API } from '../api';
import { findCustomUserStatus } from '../lib/custom-user-status';

API.v1.addRoute(
	'custom-user-status.list',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();

			return API.v1.success(
				Promise.await(
					findCustomUserStatus({
						query,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'custom-user-status.create',
	{ authRequired: true },
	{
		post() {
			check(this.bodyParams, {
				name: String,
				statusType: Match.Maybe(String),
			});

			const userStatusData = {
				name: this.bodyParams.name,
				statusType: this.bodyParams.statusType,
			};

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('insertOrUpdateUserStatus', userStatusData);
			});

			return API.v1.success({
				customUserStatus: CustomUserStatus.findOneByName(userStatusData.name),
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

			Meteor.runAsUser(this.userId, () => Meteor.call('deleteCustomUserStatus', customUserStatusId));

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'custom-user-status.update',
	{ authRequired: true },
	{
		post() {
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

			const customUserStatus = CustomUserStatus.findOneById(userStatusData._id);

			// Ensure the message exists
			if (!customUserStatus) {
				return API.v1.failure(`No custom user status found with the id of "${userStatusData._id}".`);
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('insertOrUpdateUserStatus', userStatusData);
			});

			return API.v1.success({
				customUserStatus: CustomUserStatus.findOneById(userStatusData._id),
			});
		},
	},
);
