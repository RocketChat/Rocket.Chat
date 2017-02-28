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

	api.addFiles('client/accountBox.coffee', 'client');
	api.addFiles('client/combined.coffee', 'client');
	api.addFiles('client/chatRoomItem.coffee', 'client');
	api.addFiles('client/channels.coffee', 'client');
	api.addFiles('client/createCombinedFlex.coffee', 'client');
	api.addFiles('client/directMessages.coffee', 'client');
	api.addFiles('client/listChannelsFlex.coffee', 'client');
	api.addFiles('client/listCombinedFlex.coffee', 'client');
	api.addFiles('client/listPrivateGroupsFlex.coffee', 'client');
	api.addFiles('client/privateGroups.coffee', 'client');
	api.addFiles('client/privateGroupsFlex.coffee', 'client');
	api.addFiles('client/sideNav.coffee', 'client');
	api.addFiles('client/starredRooms.coffee', 'client');
	api.addFiles('client/toolbar.js', 'client');
	api.addFiles('client/unreadRooms.coffee', 'client');
});
