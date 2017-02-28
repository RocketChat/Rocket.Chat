Package.describe({
	name: 'rocketchat:emoji-emojione',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate emojis',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'emojione:emojione',
		'rocketchat:emoji',
		'rocketchat:lib'
	]);

	api.addFiles('emojiPicker.js', 'client');

	api.addFiles('rocketchat.js', 'client');

	api.addFiles('sprites.css', 'client');
});
