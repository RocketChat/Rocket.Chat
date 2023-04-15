Package.describe({
	name: 'rocketchat:tap-i18n',
	summary: 'A comprehensive internationalization solution for Meteor',
	version: '3.0.0',
	git: 'https://github.com/TAPevents/tap-i18n',
});

const both = ['server', 'client'];

Package.onUse(function (api) {
	api.use('ecmascript', both);

	api.mainModule('server.js', both);

	api.export('TAPi18next');
	api.export('TAPi18n');
});
