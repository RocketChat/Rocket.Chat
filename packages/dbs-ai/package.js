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
	const files = _.compact(_.map(fs.readdirSync(PACKAGE_PATH + pathInPackage), function (filename) {
		return pathInPackage + '/' + filename
	}));
	api.addFiles(files, environment);
}

Package.onUse(function (api) {

	api.use(['ecmascript', 'underscore']);
	api.use('templating', 'client');
	api.use('less@2.5.1');
	api.use('rocketchat:lib');
	api.use('dbs:common');

	api.addAssets('assets/stylesheets/redlink.less', 'server');

	api.addAssets('assets/icons/sapTransaction.png', 'client');
	api.addAssets('assets/icons/peerToPeerHelp.png', 'client');
	api.addAssets('assets/icons/communication.png', 'client');
	api.addAssets('assets/icons/Hasso_MLT.png', 'client');
	api.addAssets('assets/icons/Hasso_Search.png', 'client');
	api.addAssets('assets/icons/dbsearch.png', 'client');

	api.addFiles('server/config.js', 'server');
	addDirectory(api, 'server/methods', 'server');
	addDirectory(api, 'server/lib', 'server');
	addDirectory(api, 'server/hooks', 'server');

	api.addFiles('client/redlink_ui.js', 'client');
	api.addFiles('client/lib/ClientResultProvider.js', 'client');
	addDirectory(api,'client/views/app/tabbar', 'client');

	//i18n
	const _ = Npm.require('underscore');
	const fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/dbs-ai/i18n'), function(filename) {
		if (fs.statSync('packages/dbs-ai/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n@1.8.2', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);
	console.log('Loaded tapi-files', JSON.stringify(tapi18nFiles, 2, ""));
});
