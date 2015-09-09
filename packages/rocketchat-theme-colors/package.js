Package.describe({
	name: 'rocketchat:theme-colors',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('coffeescript');
	api.use('webapp');

	api.addFiles('server.coffee', 'server');

	api.addFiles('assets/lesshat.import.less', 'server', {isAsset: true});
	api.addFiles('assets/colors.less', 'server', {isAsset: true});

	api.export('less', 'server');
	api.export('getText', 'server');
	api.export('getAndCompile', 'server');
});

Npm.depends({
	'less': 'https://github.com/meteor/less.js/tarball/8130849eb3d7f0ecf0ca8d0af7c4207b0442e3f6'
});

Package.onTest(function(api) {

});
