Package.describe({
	name: 'rocketchat:ui-message',
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
		'mongo',
		'ecmascript',
		'templating',
		'tracker',
		'rocketchat:lib',
		'rocketchat:ui-account',
		'rocketchat:ui-vrecord'
	]);

	api.addFiles('client/message.html', 'client');
	api.addFiles('client/messageBox.html', 'client');
	api.addFiles('client/messageDropdown.html', 'client');
	api.addFiles('client/messagePreview.html', 'client');
	api.addFiles('client/popup/messagePopup.html', 'client');
	api.addFiles('client/popup/messagePopupChannel.html', 'client');
	api.addFiles('client/popup/messagePopupConfig.html', 'client');
	api.addFiles('client/popup/messagePopupEmoji.html', 'client');
	api.addFiles('client/popup/messagePopupSlashCommand.html', 'client');
	api.addFiles('client/popup/messagePopupUser.html', 'client');

	api.addFiles('client/message.js', 'client');
	api.addFiles('client/messageBox.js', 'client');
	api.addFiles('client/messagePreview.js', 'client');
	api.addFiles('client/popup/messagePopup.js', 'client');
	api.addFiles('client/popup/messagePopupChannel.js', 'client');
	api.addFiles('client/popup/messagePopupConfig.js', 'client');
	api.addFiles('client/popup/messagePopupEmoji.js', 'client');

	api.addFiles('client/renderMessageBody.js', 'client');

	api.addFiles('startup/messageBoxActions.js', 'client');

	api.export('renderMessageBody');
});
