Package.describe({
	name: 'voismart:nglogin',
	version: '0.0.1',
	summary: 'Orchestra NG login integration',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'tracker',
		'rocketchat:lib',
		'sha',
		'voismart:ngapi'
	]);

	api.use(['accounts-base', 'accounts-password'], 'server');

	api.addFiles([
		'server/loginHandler.coffee',
		'server/settings.coffee'
	], ['server']);

	api.addFiles([
		'client/loginHelper.coffee'
	], ['client']);

});
