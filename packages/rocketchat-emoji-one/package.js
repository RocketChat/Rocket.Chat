Package.describe({
	name: 'rocketchat:emojione',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate emojis',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'emojione:emojione',
		'rocketchat:emoji',
		'rocketchat:lib'
	]);
	api.use('ecmascript');

	api.addFiles('emojiPicker.js', 'client');

	api.addFiles('rocketchat.js', 'client');

	api.addFiles('sprites.css', 'client');
});
