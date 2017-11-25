Package.describe({
	name: 'rocketchat:emoji-custom',
	version: '1.0.0',
	summary: 'Message pre-processor that will translate custom emoji',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:emoji',
		'rocketchat:file',
		'rocketchat:lib',
		'templating',
		'webapp'
	]);

	api.use('kadira:flow-router', 'client');

	api.addFiles('function-isSet.js');

	api.addFiles('server/startup/emoji-custom.js', 'server');
	api.addFiles('server/startup/settings.js', 'server');

	api.addFiles('server/models/EmojiCustom.js', 'server');
	api.addFiles('server/publications/fullEmojiData.js', 'server');

	api.addFiles([
		'server/methods/listEmojiCustom.js',
		'server/methods/deleteEmojiCustom.js',
		'server/methods/insertOrUpdateEmoji.js',
		'server/methods/uploadEmojiCustom.js'
	], 'server');

	api.addFiles('assets/stylesheets/emojiCustomAdmin.css', 'client');

	api.addFiles([
		'admin/startup.js',
		'admin/adminEmoji.html',
		'admin/adminEmoji.js',
		'admin/adminEmojiEdit.html',
		'admin/adminEmojiInfo.html',
		'admin/emojiPreview.html',
		'admin/emojiEdit.html',
		'admin/emojiEdit.js',
		'admin/emojiInfo.html',
		'admin/emojiInfo.js',
		'admin/route.js'
	], 'client');

	api.addFiles([
		'client/lib/emojiCustom.js',
		'client/models/EmojiCustom.js',
		'client/notifications/updateEmojiCustom.js',
		'client/notifications/deleteEmojiCustom.js'
	], 'client');
});
