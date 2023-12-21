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
	'istanbul-lib-report': '3.0.0',
	'istanbul-reports': '3.0.2',
	'istanbul-lib-coverage': '3.0.0',
});
