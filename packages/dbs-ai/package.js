Package.describe({
	name: 'dbs:ai',
	version: '0.0.1',
	summary: 'Integration of artifical knowledge',
	git: '', //not hosted on separaete git repo yet - use http://github.com/mrsimpson/Rocket.Chat
	documentation: 'README.md'
});

function addDirectory(api, pathInPackage, environment) {
	const PACKAGE_PATH = 'packages/dbs-ai/';
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
	api.use('less@2.5.1');
	api.use('rocketchat:lib'); //in order to make general setting load earlier
	api.use('dbs:common');

	api.addAssets('assets/stylesheets/redlink.less', 'server');

	api.addAssets('assets/icons/sapTransaction.png', 'client');
	api.addAssets('assets/icons/assistify.png', 'client');
	api.addAssets('assets/icons/communication.png', 'client');
	api.addAssets('assets/icons/Hasso_MLT.png', 'client');
	api.addAssets('assets/icons/Hasso_Search.png', 'client');
	api.addAssets('assets/icons/dbsearch.png', 'client');
	api.addAssets('assets/icons/deselected-circle.png', 'client');
	api.addAssets('assets/icons/selected-circle.png', 'client');

	//Common business logic
	addDirectory(api, 'methods');
	api.addFiles('models/Messages.js');

	//Server business logic
	api.addFiles('server/config.js', 'server');
	addDirectory(api, 'server/lib', 'server');
	addDirectory(api, 'server/hooks', 'server');

	//Client business logic
	api.addFiles('client/redlink_ui.js', 'client');
	api.addFiles('client/lib/ClientResultProvider.js', 'client');
	api.addFiles('client/lib/collections.js', 'client');

	//client views
	addDirectory(api, 'client/views/app/tabbar', 'client');

	//i18n in Rocket.Chat-package (packages/rocketchat-i18n/i18n
});
