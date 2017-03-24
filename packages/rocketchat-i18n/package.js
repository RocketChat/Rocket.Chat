Package.describe({
	name: 'rocketchat:i18n',
	version: '0.0.1',
	summary: 'RocketChat i18n',
	git: ''
});

Package.onUse(function(api) {
	api.use('templating', 'client');

	var fs = Npm.require('fs');
	var workingDir = process.env.PWD || '.';
	fs.readdirSync(workingDir + '/packages/rocketchat-i18n/i18n').forEach(function(filename) {
		if (filename.indexOf('.json') > -1 && fs.statSync(workingDir + '/packages/rocketchat-i18n/i18n/' + filename).size > 16) {
			api.addFiles('i18n/' + filename);
		}
	});

	api.use('tap:i18n@1.8.2');
});
