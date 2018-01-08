/* globals updateCustomUserStatus */
Meteor.startup(() =>
	RocketChat.Notifications.onLogged('updateCustomUserStatus', data => updateCustomUserStatus(data.userStatusData))
);
