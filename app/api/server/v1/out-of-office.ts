import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { check, Match } from 'meteor/check';

import { API } from '../api';
import { settings } from '../../../settings/server';
import { updateOutOfOffice } from '../../../out-of-office/server';
import { OutOfOfficeUsers } from '../../../models/server';

API.v1.addRoute(
	'out-of-office.toggle',
	{ authRequired: true },
	{
		post() {
			if (!settings.get('Out_Of_Office_Enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Out-Of-Office Not Enabled', 'out-of-office.toggle');
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					isEnabled: Boolean,
					roomIds: Array,
					customMessage: String,
					startDate: String,
					endDate: String,
				}),
			);

			const { message } = Promise.await(updateOutOfOffice({
				userId: this.userId,
				...this.bodyParams,
			}));

			return API.v1.success({ message });
		},
	},
);

API.v1.addRoute(
	'out-of-office.status',
	{ authRequired: true },
	{
		get() {
			if (!settings.get('Out_Of_Office_Enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Out-Of-Office Not Enabled', 'out-of-office.status');
			}

			const foundDocument = OutOfOfficeUsers.findOneByUserId(this.userId, {
				fields: {
					isEnabled: 1,
					roomIds: 1,
					customMessage: 1,
					startDate: 1,
					endDate: 1,
				},
			});

			if (!foundDocument) {
				return API.v1.success({
					isEnabled: false,
				});
			}

			return API.v1.success(foundDocument);
		},
	},
);
