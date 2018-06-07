Package.describe({
	name: 'rocketchat:emoji',
	version: '1.0.0',
	summary: 'Package and message pre-processor that supports aggregating multiple emoji packages',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:theme',
		'rocketchat:ui-message'
	]);

	api.addFiles('client/function-isSet.js', 'client');
	api.addFiles('client/rocketchat.js');

	api.addFiles('client/emojiParser.js', 'client');

	api.addFiles('client/emojiPicker.html', 'client');
	api.addFiles('client/emojiPicker.js', 'client');

	api.addFiles('client/lib/emojiRenderer.js', 'client');
	api.addFiles('client/lib/EmojiPicker.js', 'client');
	api.addFiles('client/emojiButton.js', 'client');
	api.addFiles('client/keyboardFix.js', 'client');

	api.export('renderEmoji');
});
