Package.describe({
	name: 'rocketchat:streamer',
	version: '1.1.0',
	summary: 'DB less realtime communication for meteor',
	git: 'https://github.com/RocketChat/meteor-streamer.git'
});

Package.onUse(function(api) {
	api.use('ddp-common@1.2.2');
	api.use('ecmascript@0.1.6');
	api.use('check@1.1.0');
	api.use('tracker@1.0.9');
	api.use('typescript');

	api.addFiles('lib/ev.ts');

	api.addFiles('client/client.ts', 'client');

	api.addFiles('server/server.ts', 'server');

	api.export('Streamer');
});
