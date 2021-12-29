import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { userStatus } from './userStatus';

userStatus.packages.customUserStatus = {
	list: [],
};

export const deleteCustomUserStatus = function (customUserStatusData) {
	delete userStatus.list[customUserStatusData._id];

	const arrayIndex = userStatus.packages.customUserStatus.list.indexOf(customUserStatusData._id);
	if (arrayIndex !== -1) {
		userStatus.packages.customUserStatusData.list.splice(arrayIndex, 1);
	}
};

export const updateCustomUserStatus = function (customUserStatusData) {
	const newUserStatus = {
		name: customUserStatusData.name,
		id: customUserStatusData._id,
		statusType: customUserStatusData.statusType,
		localizeName: false,
	};

	const arrayIndex = userStatus.packages.customUserStatus.list.indexOf(newUserStatus.id);
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

		Meteor.call('listCustomUserStatus', (error, result) => {
			if (!result) {
				return;
			}

			for (const customStatus of result) {
				const newUserStatus = {
					name: customStatus.name,
					id: customStatus._id,
					statusType: customStatus.statusType,
					localizeName: false,
				};

				userStatus.packages.customUserStatus.list.push(newUserStatus);
				userStatus.list[newUserStatus.id] = newUserStatus;
			}
		});
	});
});
