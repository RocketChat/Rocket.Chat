Package.describe({
	name: 'rocketchat:rocketchat-ui',
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
		'mongo',
		'session',
		'jquery',
		'tracker',
		'reactive-var',
		'ecmascript',
		'templating',
		'coffeescript',
		'underscore',
		'rocketchat:lib@0.0.1'
	]);

	// LIB FILES
	api.addFiles('lib/accountBox.coffee', 'client');
	api.addFiles('lib/accounts.coffee', 'client');
	api.addFiles('lib/avatar.coffee', 'client');
	api.addFiles('lib/chatMessages.coffee', 'client');
	api.addFiles('lib/collections.coffee', 'client');
	api.addFiles('lib/constallation.js', 'client');
	api.addFiles('lib/customEventPolyfill.js', 'client');
	api.addFiles('lib/fileUpload.coffee', 'client');
	api.addFiles('lib/fireEvent.coffee', 'client');
	api.addFiles('lib/jquery.swipebox.min.js', 'client');
	api.addFiles('lib/menu.coffee', 'client');
	api.addFiles('lib/modal.coffee', 'client');
	api.addFiles('lib/Modernizr.js', 'client');
	api.addFiles('lib/msgTyping.coffee', 'client');
	api.addFiles('lib/notification.coffee', 'client');
	api.addFiles('lib/parentTemplate.js', 'client');
	api.addFiles('lib/particles.js', 'client');
	api.addFiles('lib/readMessages.coffee', 'client');
	api.addFiles('lib/rocket.coffee', 'client');
	api.addFiles('lib/RoomHistoryManager.coffee', 'client');
	api.addFiles('lib/RoomManager.coffee', 'client');
	api.addFiles('lib/sideNav.coffee', 'client');
	api.addFiles('lib/tapi18n.coffee', 'client');
	api.addFiles('lib/textarea-autogrow.js', 'client');
	api.addFiles('lib/trackRoomNameChanged.coffee', 'client');

	// TEMPLATE FILES
	api.addFiles('views/cmsPage.html', 'client');
	api.addFiles('views/error.html', 'client');
	api.addFiles('views/fxos.html', 'client');
	api.addFiles('views/loading.html', 'client');
	api.addFiles('views/main.html', 'client');
	api.addFiles('views/modal.html', 'client');
	api.addFiles('views/404/roomNotFound.html', 'client');
	api.addFiles('views/username/layout.html', 'client');
	api.addFiles('views/username/username.html', 'client');
	api.addFiles('views/app/audioNotification.html', 'client');
	api.addFiles('views/app/burguer.html', 'client');
	api.addFiles('views/app/flexTabBar.html', 'client');
	api.addFiles('views/app/home.html', 'client');
	api.addFiles('views/app/message.html', 'client');
	api.addFiles('views/app/messagePopup.html', 'client');
	api.addFiles('views/app/messagePopupChannel.html', 'client');
	api.addFiles('views/app/messagePopupConfig.html', 'client');
	api.addFiles('views/app/messagePopupEmoji.html', 'client');
	api.addFiles('views/app/messagePopupSlashCommand.html', 'client');
	api.addFiles('views/app/messagePopupUser.html', 'client');
	api.addFiles('views/app/privateHistory.html', 'client');
	api.addFiles('views/app/room.html', 'client');
	api.addFiles('views/app/roomSearch.html', 'client');
	api.addFiles('views/app/userInfo.html', 'client');
	api.addFiles('views/app/userSearch.html', 'client');
	api.addFiles('views/app/spotlight/mobileMessageMenu.html', 'client');
	api.addFiles('views/app/spotlight/spotlight.html', 'client');
	api.addFiles('views/app/tabBar/membersList.html', 'client');
	api.addFiles('views/app/tabBar/messageSearch.html', 'client');
	api.addFiles('views/app/tabBar/uploadedFilesList.html', 'client');
	api.addFiles('views/app/videoCall/videoButtons.html', 'client');
	api.addFiles('views/app/videoCall/videoCall.html', 'client');

	api.addFiles('views/cmsPage.coffee', 'client');
	api.addFiles('views/fxos.coffee', 'client');
	api.addFiles('views/main.coffee', 'client');
	api.addFiles('views/modal.coffee', 'client');
	api.addFiles('views/404/roomNotFound.coffee', 'client');
	api.addFiles('views/username/username.coffee', 'client');
	api.addFiles('views/app/burguer.coffee', 'client');
	api.addFiles('views/app/flexTabBar.coffee', 'client');
	api.addFiles('views/app/home.coffee', 'client');
	api.addFiles('views/app/message.coffee', 'client');
	api.addFiles('views/app/messagePopup.coffee', 'client');
	api.addFiles('views/app/messagePopupConfig.coffee', 'client');
	api.addFiles('views/app/messagePopupEmoji.coffee', 'client');
	api.addFiles('views/app/privateHistory.coffee', 'client');
	api.addFiles('views/app/room.coffee', 'client');
	api.addFiles('views/app/roomSearch.coffee', 'client');
	api.addFiles('views/app/userInfo.coffee', 'client');
	api.addFiles('views/app/spotlight/mobileMessageMenu.coffee', 'client');
	api.addFiles('views/app/spotlight/spotlight.coffee', 'client');
	api.addFiles('views/app/tabBar/membersList.coffee', 'client');
	api.addFiles('views/app/tabBar/messageSearch.coffee', 'client');
	api.addFiles('views/app/tabBar/uploadedFilesList.coffee', 'client');
	api.addFiles('views/app/videoCall/videoButtons.coffee', 'client');
	api.addFiles('views/app/videoCall/videoCall.coffee', 'client');

});