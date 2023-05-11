Package.describe({
	name: 'kadira:flow-router',
	summary: 'Carefully Designed Client Side Router for Meteor',
	version: '2.12.1',
	git: 'https://github.com/kadirahq/flow-router.git',
});

Npm.depends({
	// In order to support IE9, we had to fork pagejs and apply
	// this PR: https://github.com/visionmedia/page.js/pull/288
	page: 'https://github.com/kadirahq/page.js/archive/34ddf45ea8e4c37269ce3df456b44fc0efc595c6.tar.gz',
	qs: '5.2.0',
});

Package.onUse(function (api) {
	api.use('underscore');
	api.use('tracker');
	api.use('reactive-dict');
	api.use('reactive-var');
	api.use('ejson');
	api.use('modules');

	api.use('meteorhacks:fast-render@2.14.0', ['client', 'server'], { weak: true });

	api.addFiles('client/modules.js', 'client');
	api.addFiles('client/triggers.js', 'client');
	api.addFiles('client/router.js', 'client');
	api.addFiles('client/group.js', 'client');
	api.addFiles('client/route.js', 'client');
	api.addFiles('client/_init.js', 'client');

	api.addFiles('server/router.js', 'server');
	api.addFiles('server/group.js', 'server');
	api.addFiles('server/route.js', 'server');
	api.addFiles('server/_init.js', 'server');

	api.addFiles('server/plugins/fast_render.js', 'server');

	api.addFiles('lib/router.js', ['client', 'server']);
	api.export('FlowRouter');
});
