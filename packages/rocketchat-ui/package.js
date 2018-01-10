Package.describe({
	name: 'rocketchat:ui',
	version: '0.1.0',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Npm.depends({
	clipboard: '1.7.1'
});

Package.onUse(function(api) {
	api.use([
		'accounts-base',
		'mongo',
		'session',
		'jquery',
		'tracker',
		'reactive-var',
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:ui-master',
		'raix:push',
		'raix:ui-dropped-event'
	]);

	api.use('kadira:flow-router', 'client');

	api.addFiles('getAvatarUrlFromUsername.js');

	// LIB FILES
	api.addFiles('client/lib/accountBox.js', 'client');
	api.addFiles('client/lib/accounts.js', 'client');
	api.addFiles('client/lib/avatar.js', 'client');
	api.addFiles('client/lib/chatMessages.js', 'client');
	api.addFiles('client/lib/collections.js', 'client');
	api.addFiles('client/lib/customEventPolyfill.js', 'client');
	api.addFiles('client/lib/fileUpload.js', 'client');
	api.addFiles('client/lib/fireEvent.js', 'client');
	api.addFiles('client/lib/iframeCommands.js', 'client');
	api.addFiles('client/lib/menu.js', 'client');
	api.addFiles('client/lib/modal.js', 'client');
	api.addFiles('client/lib/Modernizr.js', 'client');
	api.addFiles('client/lib/msgTyping.js', 'client');
	api.addFiles('client/lib/notification.js', 'client');
	api.addFiles('client/lib/parentTemplate.js', 'client');
	api.addFiles('client/lib/readMessages.js', 'client');
	api.addFiles('client/lib/rocket.js', 'client');
	api.addFiles('client/lib/RoomHistoryManager.js', 'client');
	api.addFiles('client/lib/RoomManager.js', 'client');
	api.addFiles('client/lib/sideNav.js', 'client');
	api.addFiles('client/lib/tapi18n.js', 'client');
	api.addFiles('client/lib/textarea-autogrow.js', 'client');

	api.addFiles('client/lib/codeMirror/codeMirror.js', 'client');

	// LIB CORDOVA
	api.addFiles('client/lib/cordova/facebook-login.js', 'client');
	api.addFiles('client/lib/cordova/keyboard-fix.js', 'client');
	api.addFiles('client/lib/cordova/push.js', 'client');
	api.addFiles('client/lib/cordova/urls.js', 'client');
	api.addFiles('client/lib/cordova/user-state.js', 'client');

	// LIB RECORDERJS
	api.addFiles('client/lib/recorderjs/audioRecorder.js', 'client');
	api.addFiles('client/lib/recorderjs/videoRecorder.js', 'client');
	api.addFiles('client/lib/recorderjs/recorder.js', 'client');

	// TEXTAREA CURSOR MANAGEMENT
	api.addFiles('client/lib/textarea-cursor/set-cursor-position.js', 'client');
	api.addFiles('client/lib/esc.js', 'client');

	// TEMPLATE FILES
	api.addFiles('client/views/cmsPage.html', 'client');
	api.addFiles('client/views/fxos.html', 'client');
	api.addFiles('client/views/modal.html', 'client');
	api.addFiles('client/views/404/roomNotFound.html', 'client');
	api.addFiles('client/views/404/invalidSecretURL.html', 'client');
	api.addFiles('client/views/app/audioNotification.html', 'client');
	api.addFiles('client/views/app/burger.html', 'client');
	api.addFiles('client/views/app/createChannel.html', 'client');
	api.addFiles('client/views/app/createRooms.html', 'client');
	api.addFiles('client/views/app/fullModal.html', 'client');
	api.addFiles('client/views/app/home.html', 'client');
	api.addFiles('client/views/app/notAuthorized.html', 'client');
	api.addFiles('client/views/app/pageContainer.html', 'client');
	api.addFiles('client/views/app/pageSettingsContainer.html', 'client');
	api.addFiles('client/views/app/privateHistory.html', 'client');
	api.addFiles('client/views/app/room.html', 'client');
	api.addFiles('client/views/app/roomSearch.html', 'client');
	api.addFiles('client/views/app/secretURL.html', 'client');
	api.addFiles('client/views/app/userSearch.html', 'client');
	api.addFiles('client/views/app/videoCall/videoButtons.html', 'client');
	api.addFiles('client/views/app/videoCall/videoCall.html', 'client');
	api.addFiles('client/views/app/popover.html', 'client');
	api.addFiles('client/views/app/modal.html', 'client');
	api.addFiles('client/views/app/photoswipe.html', 'client');
	api.addFiles('client/views/app/globalAnnouncement.html', 'client');

	api.addFiles('client/views/cmsPage.js', 'client');
	api.addFiles('client/views/fxos.js', 'client');
	api.addFiles('client/views/modal.js', 'client');
	api.addFiles('client/views/404/roomNotFound.js', 'client');
	api.addFiles('client/views/app/burger.js', 'client');
	api.addFiles('client/views/app/createChannel.js', 'client');
	api.addFiles('client/views/app/createRooms.js', 'client');
	api.addFiles('client/views/app/fullModal.js', 'client');
	api.addFiles('client/views/app/home.js', 'client');
	api.addFiles('client/views/app/privateHistory.js', 'client');
	api.addFiles('client/views/app/room.js', 'client');
	api.addFiles('client/views/app/roomSearch.js', 'client');
	api.addFiles('client/views/app/secretURL.js', 'client');
	api.addFiles('client/views/app/videoCall/videoButtons.js', 'client');
	api.addFiles('client/views/app/videoCall/videoCall.js', 'client');
	api.addFiles('client/views/app/popover.js', 'client');
	api.addFiles('client/views/app/modal.js', 'client');
	api.addFiles('client/views/app/photoswipe.js', 'client');
	api.addFiles('client/views/app/globalAnnouncement.js', 'client');


	api.addFiles('client/components/icon.html', 'client');
	api.addFiles('client/components/icon.js', 'client');

	api.addFiles('client/components/popupList.html', 'client');
	api.addFiles('client/components/popupList.js', 'client');

	api.addFiles('client/components/selectDropdown.html', 'client');
	api.addFiles('client/components/selectDropdown.js', 'client');

	api.addFiles('client/components/tabContainer.html', 'client');
	api.addFiles('client/components/tabContainer.js', 'client');

	api.export('fileUpload');
});
