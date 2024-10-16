Package.describe({
	summary: 'Allow injection of arbitrary data to initial Meteor HTML page',
	version: '1.0.5',
	git: 'https://github.com/meteorhacks/meteor-inject-initial.git',
	name: 'meteorhacks:inject-initial',
});

Package.onUse(function (api) {
	api.use(['routepolicy', 'webapp'], 'server');
	api.use(['ejson', 'underscore'], ['server']);

	api.addFiles('lib/inject-server.js', 'server');
	api.addFiles('lib/inject-core.js', 'server');

	api.export('Inject', 'server');
});
