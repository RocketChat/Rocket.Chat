import { ICustomUserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { sdk } from '../../../utils/client/lib/SDKClient';
import { userStatus } from './userStatus';
import { UserStatus } from '@rocket.chat/core-typings';

export const deleteCustomUserStatus = function (customUserStatusData: ICustomUserStatus) {
	delete userStatus.list[customUserStatusData._id];

	const arrayIndex = userStatus.packages.customUserStatus.list.findIndex((x) => x.id === customUserStatusData._id);
	if (arrayIndex !== -1) {
		userStatus.packages.customUserStatus.list.splice(arrayIndex, 1);
	}
};

export const updateCustomUserStatus = function (customUserStatusData: ICustomUserStatus) {
	const newUserStatus = {
		name: customUserStatusData.name,
		id: customUserStatusData._id,
		statusType: customUserStatusData.statusType as UserStatus,
		localizeName: false,
	};

	const arrayIndex = userStatus.packages.customUserStatus.list.findIndex(x => x.id === newUserStatus.id);
	if (arrayIndex === -1) {
		userStatus.packages.customUserStatus.list.push(newUserStatus);
	} else {
		userStatus.packages.customUserStatus.list[arrayIndex] = newUserStatus;
	}

	userStatus.list[newUserStatus.id] = newUserStatus;
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		void sdk.call('listCustomUserStatus').then((result) => {
			if (!result) {
				return;
			}

			for (const customStatus of result) {
				const newUserStatus = {
					name: customStatus.name,
					id: customStatus._id,
					statusType: customStatus.statusType as UserStatus,
					localizeName: false,
				};

				userStatus.packages.customUserStatus.list.push(newUserStatus);
				userStatus.list[newUserStatus.id] = newUserStatus;
			}
		});
	});
});
