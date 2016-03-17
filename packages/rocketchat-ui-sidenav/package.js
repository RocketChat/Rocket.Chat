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
	api.versionsFrom('1.2.1');

	api.use([
		'ecmascript',
		'templating',
		'coffeescript',
		'underscore',
		'rocketchat:lib',
		'rocketchat:ui'
	]);

	api.addFiles('side-nav/accountBox.html', 'client');
	api.addFiles('side-nav/channels.html', 'client');
	api.addFiles('side-nav/chatRoomItem.html', 'client');
	api.addFiles('side-nav/createChannelFlex.html', 'client');
	api.addFiles('side-nav/directMessages.html', 'client');
	api.addFiles('side-nav/directMessagesFlex.html', 'client');
	api.addFiles('side-nav/listChannelsFlex.html', 'client');
	api.addFiles('side-nav/listDirectMessagesFlex.html', 'client');
	api.addFiles('side-nav/listPrivateGroupsFlex.html', 'client');
	api.addFiles('side-nav/privateGroups.html', 'client');
	api.addFiles('side-nav/privateGroupsFlex.html', 'client');
	api.addFiles('side-nav/sideNav.html', 'client');
	api.addFiles('side-nav/starredRooms.html', 'client');
	api.addFiles('side-nav/unreadRooms.html', 'client');
	api.addFiles('side-nav/userStatus.html', 'client');

	api.addFiles('side-nav/accountBox.coffee', 'client');
	api.addFiles('side-nav/channels.coffee', 'client');
	api.addFiles('side-nav/chatRoomItem.coffee', 'client');
	api.addFiles('side-nav/createChannelFlex.coffee', 'client');
	api.addFiles('side-nav/directMessages.coffee', 'client');
	api.addFiles('side-nav/directMessagesFlex.coffee', 'client');
	api.addFiles('side-nav/listChannelsFlex.coffee', 'client');
	api.addFiles('side-nav/listDirectMessagesFlex.js', 'client');
	api.addFiles('side-nav/listPrivateGroupsFlex.coffee', 'client');
	api.addFiles('side-nav/privateGroups.coffee', 'client');
	api.addFiles('side-nav/privateGroupsFlex.coffee', 'client');
	api.addFiles('side-nav/sideNav.coffee', 'client');
	api.addFiles('side-nav/starredRooms.coffee', 'client');
	api.addFiles('side-nav/unreadRooms.coffee', 'client');

});

Npm.depends({
	'less': 'https://github.com/meteor/less.js/tarball/8130849eb3d7f0ecf0ca8d0af7c4207b0442e3f6',
	'less-plugin-autoprefix': '1.4.2'
});
