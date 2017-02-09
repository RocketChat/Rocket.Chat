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

	api.addFiles('side-nav/accountBox.html', 'client');
	api.addFiles('side-nav/combined.html', 'client');
	api.addFiles('side-nav/chatRoomItem.html', 'client');
	api.addFiles('side-nav/channels.html', 'client');
	api.addFiles('side-nav/createCombinedFlex.html', 'client');
	api.addFiles('side-nav/directMessages.html', 'client');
	api.addFiles('side-nav/listChannelsFlex.html', 'client');
	api.addFiles('side-nav/listCombinedFlex.html', 'client');
	api.addFiles('side-nav/listPrivateGroupsFlex.html', 'client');
	api.addFiles('side-nav/privateGroups.html', 'client');
	api.addFiles('side-nav/privateGroupsFlex.html', 'client');
	api.addFiles('side-nav/sideNav.html', 'client');
	api.addFiles('side-nav/starredRooms.html', 'client');
	api.addFiles('side-nav/toolbar.html', 'client');
	api.addFiles('side-nav/unreadRooms.html', 'client');
	api.addFiles('side-nav/userStatus.html', 'client');

	api.addFiles('side-nav/accountBox.coffee', 'client');
	api.addFiles('side-nav/combined.coffee', 'client');
	api.addFiles('side-nav/chatRoomItem.coffee', 'client');
	api.addFiles('side-nav/channels.coffee', 'client');
	api.addFiles('side-nav/createCombinedFlex.coffee', 'client');
	api.addFiles('side-nav/directMessages.coffee', 'client');
	api.addFiles('side-nav/listChannelsFlex.coffee', 'client');
	api.addFiles('side-nav/listCombinedFlex.coffee', 'client');
	api.addFiles('side-nav/listPrivateGroupsFlex.coffee', 'client');
	api.addFiles('side-nav/privateGroups.coffee', 'client');
	api.addFiles('side-nav/privateGroupsFlex.coffee', 'client');
	api.addFiles('side-nav/sideNav.coffee', 'client');
	api.addFiles('side-nav/starredRooms.coffee', 'client');
	api.addFiles('side-nav/toolbar.js', 'client');
	api.addFiles('side-nav/unreadRooms.coffee', 'client');
});
