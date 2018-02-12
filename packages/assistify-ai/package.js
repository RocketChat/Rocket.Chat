Package.describe({
	name: 'assistify:ai',
	version: '0.1.0',
	summary: 'Integration of artificial knowledge',
	git: 'http://github.com/assistify/Rocket.Chat',
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
	api.use(['ecmascript', 'underscore']);
	api.use('templating', 'client');
	api.use('rocketchat:lib'); //in order to make general settings load earlier
	api.use('rocketchat:ui-master'); //for the loading animation
	api.use('chatpal:search'); //for the loading animation

	//Server business logic
	addDirectory(api, 'server/lib', 'server');
	addDirectory(api, 'server/hooks', 'server');
	addDirectory(api, 'server/methods', 'server');

	// Smarti proxy and router
	api.addFiles('server/SmartiProxy.js', 'server');
	api.addFiles('server/SmartiRouter.js', 'server');

	//Configuration
	api.addFiles('config.js', 'server');

	//migration scripts
	api.addFiles('server/migrations.js', 'server');

	//Client business logic
	api.addFiles('client/tabbar.js', 'client');
	api.addFiles('client/hooks/openAiTab.js', 'client');

	//client views
	addDirectory(api, 'client/views/app/tabbar', 'client');
	api.addFiles('client/smartiLoader.js', 'client');

	//styling
	api.addFiles('client/public/stylesheets/smarti.css', 'client');

	//Assets
	api.addAssets('client/public/assistify.png', 'client');
	api.addAssets('client/public/assistify-beta.png', 'client');

	//i18n in Rocket.Chat-package (packages/rocketchat-i18n/i18n

	api.mainModule('assistify-ai.js', 'server');

});
