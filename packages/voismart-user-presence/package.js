Package.describe({
	name: 'voismart:user-presence',
	summary: 'Track user status',
	version: '1.2.9'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0.2.1');

	api.use('nooitaf:colors@1.1.2_1');
	api.use('underscore');

	api.addFiles('common/common.js');
	api.addFiles('server/server.js', ['server']);
	api.addFiles('server/monitor.js', ['server']);
	api.addFiles('client/client.js', ['client']);

	api.export(['UserPresence'], ['server', 'client']);
	api.export(['UserPresenceMonitor'], ['server']);
});
