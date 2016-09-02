Package.describe({
	name: 'rocketchat:custom-emoji',
	version: '1.0.0',
	summary: 'Message pre-processor that will translate custom emoji',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'ecmascript',
		'less@2.5.1',
		'rocketchat:emoji-base',
		'rocketchat:file',
		'rocketchat:lib',
		'templating',
		'underscore',
		'webapp'
	]);

	api.use('kadira:flow-router', 'client');

	api.addFiles('function-isSet.js');

	api.addFiles('server/startup/custom-emoji.js', 'server');
	api.addFiles('server/startup/settings.js', 'server');

	api.addFiles('server/models/CustomEmoji.js', 'server');
	api.addFiles('server/publications/fullEmojiData.js', 'server');

	api.addFiles([
		'server/methods/listCustomEmoji.js',
		'server/methods/deleteCustomEmoji.js',
		'server/methods/insertOrUpdateEmoji.js',
		'server/methods/uploadCustomEmoji.js'
	], 'server');

	api.addFiles('assets/stylesheets/customEmojiAdmin.less', 'client');

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
		'client/lib/customEmoji.js',
		'client/models/CustomEmoji.js',
		'client/notifications/updateCustomEmoji.js',
		'client/notifications/deleteCustomEmoji.js'
	], 'client');
});
