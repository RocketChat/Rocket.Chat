Package.describe({
	name: 'rocketchat:emojione',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate emojis',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'emojione:emojione@2.1.2',
		'rocketchat:lib'
	]);
	api.use('rocketchat:theme');
	api.use('rocketchat:ui-message');

	api.use('reactive-var');
	api.use('templating');
	api.use('ecmascript');
	api.use('less@2.5.1');

	api.addFiles('emojione.coffee', ['server','client']);
	api.addFiles('rocketchat.coffee', 'client');

	api.addFiles('emojiPicker.html', 'client');
	api.addFiles('emojiPicker.js', 'client');

	api.addAssets('emojiPicker.less', 'server');
	api.addFiles('loadStylesheet.js', 'server');

	api.addFiles('lib/EmojiPicker.js', 'client');
	api.addFiles('emojiButton.js', 'client');
});
