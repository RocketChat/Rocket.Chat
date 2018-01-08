RocketChat.userStatus.packages.customUserStatus = {
	list: []
};

deleteCustomUserStatus = function(customUserStatusData) {
	delete RocketChat.userStatus.list[customUserStatusData._id];

	const arrayIndex = RocketChat.userStatus.packages.customUserStatus.list.indexOf(customUserStatusData._id);
	if (arrayIndex !== -1) {
		RocketChat.userStatus.packages.customUserStatusData.list.splice(arrayIndex, 1);
	}
};

updateCustomUserStatus = function(customUserStatusData) {
	const newUserStatus = {
		name: customUserStatusData.name,
		id: customUserStatusData._id,
		statusType: customUserStatusData.statusType,
		localizeName: false
	};

	const arrayIndex = RocketChat.userStatus.packages.customUserStatus.list.indexOf(newUserStatus.id);
	if (arrayIndex === -1) {
		RocketChat.userStatus.packages.customUserStatus.list.push(newUserStatus);
	} else {
		RocketChat.userStatus.packages.customUserStatus.list[arrayIndex] = newUserStatus;
	}

	RocketChat.userStatus.list[newUserStatus.id] = newUserStatus;
};

Meteor.startup(() =>
	Meteor.call('listCustomUserStatus', (error, result) => {
		for (const userStatus of result) {
			const newUserStatus = {
				name: userStatus.name,
				id: userStatus._id,
				statusType: userStatus.statusType,
				localizeName: false
			};

			RocketChat.userStatus.packages.customUserStatus.list.push(newUserStatus);
			RocketChat.userStatus.list[newUserStatus.id] = newUserStatus;
		}
	})
);