Package.describe({
	name: 'rocketchat:coverage',
	summary: '',
	version: '1.0.0',
});

Package.onUse(function (api) {
	api.use('ecmascript');
	api.use('isobuild:compiler-plugin@1.0.0');

	api.mainModule('plugin/compile-version.js', 'server');
});

Npm.depends({
	'istanbul-lib-report': '3.0.1',
	'istanbul-reports': '3.1.7',
	'istanbul-lib-coverage': '3.2.2',
});
