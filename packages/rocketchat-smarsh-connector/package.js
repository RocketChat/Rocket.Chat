Package.describe({
	name: 'rocketchat:smarsh-connector',
	version: '0.0.1',
	summary: 'Smarsh Connector',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'ecmascript',
		'rocketchat:lib',
		'underscore',
		'mrt:moment',
		'mrt:moment-timezone'
	]);

	api.addFiles('lib/rocketchat.js', [ 'client', 'server' ]);
	api.addFiles([
		'server/settings.js',
		'server/models/SmarshHistory.js',
		'server/functions/sendEmail.js',
		'server/functions/generateEml.js',
		'server/startup.js'
	], 'server');
});
