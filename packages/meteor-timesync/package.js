Package.describe({
  name: 'mizzao:timesync',
  summary: 'NTP-style time synchronization between server and client',
  version: '0.3.4',
  git: 'https://github.com/mizzao/meteor-timesync.git'
});

Package.onUse(function (api) {
	api.use([
		'check',
		'tracker',
		'http',
	], 'client');

	api.use([
		'webapp',
	], 'server');

  api.use([
		'ecmascript',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});

Package.onTest(function (api) {
	api.use([
		'ecmascript',
		'tinytest',
		'test-helpers'
	]);

	api.use(['tracker'], 'client');

	api.use('mizzao:timesync');

	api.addFiles('tests/client.js', 'client');
});
