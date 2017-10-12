Package.describe({
	name: 'assistify:ai',
	version: '0.0.1',
	summary: 'Integration of artificial knowledge',
	git: '', //not hosted on separaete git repo yet - use http://github.com/mrsimpson/Rocket.Chat
	documentation: 'README.md'
});

function addDirectory(api, pathInPackage, environment) {
	const PACKAGE_PATH = 'packages/assistify-ai/';
	const _ = Npm.require('underscore');
	const fs = Npm.require('fs');
	const files = _.compact(_.map(fs.readdirSync(PACKAGE_PATH + pathInPackage), function(filename) {
		return `${ pathInPackage }/${ filename }`;
	}));
	api.addFiles(files, environment);
}

Package.onUse(function(api) {
	api.mainModule('assistify-ai.js');

	api.use(['ecmascript', 'underscore']);
	api.use('templating', 'client');
	api.use('less@2.5.1');
	api.use('rocketchat:lib'); //in order to make general settings load earlier
	api.use('assistify');

	//Server business logic
	addDirectory(api, 'server/lib', 'server');
	addDirectory(api, 'server/hooks', 'server');
	addDirectory(api, 'server/methods', 'server');

	//Configuration
	api.addFiles('config.js', 'server');

	//Client business logic
	api.addFiles('client/tabbar.js', 'client');

	//client views
	addDirectory(api, 'client/views/app/tabbar', 'client');

	//public components
	api.addFiles('assistify-ai.js', 'server');

	// api.export('getKnowledgeAdapter');

	//i18n in Rocket.Chat-package (packages/rocketchat-i18n/i18n
});
