Package.describe({
	name: 'arunoda:streams',
	version: '0.1.17',
	summary: "DB less realtime communication for meteor"
});

Package.on_use(function (api, where) {
  api.use('underscore', ['client', 'server']);
  api.add_files(['lib/ev.js', 'lib/server.js', 'lib/stream_permission.js'], 'server');
  api.add_files(['lib/ev.js', 'lib/client.js'], 'client');
});
