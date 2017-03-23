Package.describe({
	name: 'rocketchat:ui-sidenav',
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
		'rocketchat:lib',
		'rocketchat:ui'
	]);

	api.addFiles('client/accountBox.html', 'client');
	api.addFiles('client/combined.html', 'client');
	api.addFiles('client/chatRoomItem.html', 'client');
	api.addFiles('client/channels.html', 'client');
	api.addFiles('client/createCombinedFlex.html', 'client');
	api.addFiles('client/directMessages.html', 'client');
	api.addFiles('client/listChannelsFlex.html', 'client');
	api.addFiles('client/listCombinedFlex.html', 'client');
	api.addFiles('client/listPrivateGroupsFlex.html', 'client');
	api.addFiles('client/privateGroups.html', 'client');
	api.addFiles('client/privateGroupsFlex.html', 'client');
	api.addFiles('client/sideNav.html', 'client');
	api.addFiles('client/starredRooms.html', 'client');
	api.addFiles('client/toolbar.html', 'client');
	api.addFiles('client/unreadRooms.html', 'client');
	api.addFiles('client/userStatus.html', 'client');

	api.addFiles('client/accountBox.js', 'client');
	api.addFiles('client/combined.js', 'client');
	api.addFiles('client/chatRoomItem.js', 'client');
	api.addFiles('client/channels.js', 'client');
	api.addFiles('client/createCombinedFlex.js', 'client');
	api.addFiles('client/directMessages.js', 'client');
	api.addFiles('client/listChannelsFlex.js', 'client');
	api.addFiles('client/listCombinedFlex.js', 'client');
	api.addFiles('client/listPrivateGroupsFlex.js', 'client');
	api.addFiles('client/privateGroups.js', 'client');
	api.addFiles('client/privateGroupsFlex.js', 'client');
	api.addFiles('client/sideNav.js', 'client');
	api.addFiles('client/starredRooms.js', 'client');
	api.addFiles('client/toolbar.js', 'client');
	api.addFiles('client/unreadRooms.js', 'client');
});
