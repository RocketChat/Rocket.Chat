/* globals deleteCustomUserStatus */
Meteor.startup(() =>
	RocketChat.Notifications.onLogged('deleteCustomUserStatus', data => deleteCustomUserStatus(data.userStatusData))
);
