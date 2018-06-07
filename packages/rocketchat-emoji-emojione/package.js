Package.describe({
	name: 'rocketchat:emoji-emojione',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate emojis',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'emojione:emojione@2.2.6',
		'rocketchat:emoji',
		'rocketchat:lib'
	]);

	api.addFiles('emojiPicker.js');

	api.addFiles('rocketchat.js');

	api.addFiles('client/sprites.css', 'client');
	api.addFiles('server/callbacks.js', 'server');
});
