Package.describe({
	name: 'rocketchat:streamer',
	version: '1.1.0',
	summary: 'DB less realtime communication for meteor',
	git: 'https://github.com/RocketChat/meteor-streamer.git',
});

Package.onUse(function (api) {
	api.use('ddp-common');
	api.use('ecmascript');
	api.use('check');
	api.use('tracker');

	api.addFiles('lib/ev.js');

	api.addFiles('server/server.js', 'server');

	api.export('Streamer');
});
