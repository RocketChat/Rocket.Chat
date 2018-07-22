Package.describe({
	name: 'rocketchat:webdav',
	version: '0.0.1',

	summary: 'Package for RocketChat users to interact with WebDAV servers.',

	git: '',

	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('mongo');
	api.use('templating');
	api.use('rocketchat:lib');
	api.use('rocketchat:api');
	api.use('rocketchat:grant');

	api.addFiles('client/addWebdavAccount.html', 'client');
	api.addFiles('client/addWebdavAccount.js', 'client');
	api.addFiles('client/webdavFilePicker.html', 'client');
	api.addFiles('client/webdavFilePicker.js', 'client');
	api.addFiles('client/stylesheets/webdavFilePicker.css', 'client');
	api.addFiles('client/collections/WebdavAccounts.js', 'client');

	api.addFiles('server/addNewWebdavAccount.js', 'server');
	api.addFiles('server/getWebdavFileList.js', 'server');
	api.addFiles('server/getFileFromWebdav.js', 'server');
	api.addFiles('server/models/WebdavAccounts.js', 'server');
	api.addFiles('server/publications/webdavAccounts.js', 'server');

	api.addFiles('startup/messageBoxActions.js', 'client');
	api.addFiles('startup/settings.js', 'server');
});
