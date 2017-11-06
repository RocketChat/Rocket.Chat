Package.describe({
	name: 'rocketchat:oembed',
	version: '0.0.1',
	summary: 'Message pre-processor that insert oEmbed widget in template',
	git: ''
});

Npm.depends({
	'he': '1.1.0',
	'jschardet': '1.4.1',
	'iconv-lite': '0.4.13',
	'ip-range-check': '0.0.2'
});

Package.onUse(function(api) {
	api.use([
		'http',
		'templating',
		'ecmascript',
		'konecty:change-case',
		'rocketchat:lib'
	]);

	api.addFiles('client/baseWidget.html', 'client');
	api.addFiles('client/baseWidget.js', 'client');

	api.addFiles('client/oembedImageWidget.html', 'client');
	api.addFiles('client/oembedImageWidget.js', 'client');

	api.addFiles('client/oembedAudioWidget.html', 'client');
	api.addFiles('client/oembedAudioWidget.js', 'client');

	api.addFiles('client/oembedVideoWidget.html', 'client');
	api.addFiles('client/oembedVideoWidget.js', 'client');

	api.addFiles('client/oembedYoutubeWidget.html', 'client');
	api.addFiles('client/oembedYoutubeWidget.js', 'client');

	api.addFiles('client/oembedUrlWidget.html', 'client');
	api.addFiles('client/oembedUrlWidget.js', 'client');

	api.addFiles('client/oembedFrameWidget.html', 'client');
	api.addFiles('client/oembedFrameWidget.js', 'client');

	api.addFiles('client/oembedSandstormGrain.html', 'client');
	api.addFiles('client/oembedSandstormGrain.js', 'client');

	api.addFiles('server/server.js', 'server');
	api.addFiles('server/providers.js', 'server');
	api.addFiles('server/jumpToMessage.js', 'server');
	api.addFiles('server/models/OEmbedCache.js', 'server');

	api.export('OEmbed', 'server');
});
