Package.describe({
	name: 'rocketchat:ui-admin',
	version: '0.1.0',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'coffeescript',
		'underscore',
		'rocketchat:lib'
	]);

	// template files
	api.addFiles('client/admin.html', 'client');
	api.addFiles('client/adminFlex.html', 'client');
	api.addFiles('client/adminInfo.html', 'client');

	api.addFiles('client/rooms/adminRooms.html', 'client');
	api.addFiles('client/rooms/adminRoomInfo.html', 'client');
	api.addFiles('client/rooms/adminRoomInfo.coffee', 'client');
	api.addFiles('client/rooms/channelSettingsDefault.html', 'client');
	api.addFiles('client/rooms/channelSettingsDefault.js', 'client');

	api.addFiles('client/users/adminInviteUser.html', 'client');
	api.addFiles('client/users/adminUserChannels.html', 'client');
	api.addFiles('client/users/adminUserEdit.html', 'client');
	api.addFiles('client/users/adminUserInfo.html', 'client');
	api.addFiles('client/users/adminUsers.html', 'client');

	// coffee files
	api.addFiles('client/admin.coffee', 'client');
	api.addFiles('client/adminFlex.coffee', 'client');
	api.addFiles('client/adminInfo.coffee', 'client');

	api.addFiles('client/rooms/adminRooms.coffee', 'client');

	api.addFiles('client/users/adminInviteUser.coffee', 'client');
	api.addFiles('client/users/adminUserChannels.coffee', 'client');
	api.addFiles('client/users/adminUsers.coffee', 'client');

	api.addFiles('publications/adminRooms.js', 'server');

	// api.addAssets('styles/side-nav.less', 'client');
});
