Package.describe({
	name: 'rocketchat:graphql',
	version: '0.0.1',
	summary: 'GraphQL API',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'underscore',
		'ecmascript',
		'http',
		'rocketchat:lib',
		'rocketchat:api',
		'rocketchat:accounts',
		'swydo:graphql'
	]);
	api.addFiles('server/settings.js', 'server');
	api.mainModule('server/api.js', 'server');
});

Npm.depends({
	'@accounts/graphql-api': '0.1.1',
	'apollo-server-express': '1.1.2',
	'cors': '2.8.4',
	'body-parser': '1.17.2',
	'express': '4.15.4',
	'graphql': '0.10.3',
	'graphql-subscriptions': '0.4.4',
	'graphql-tools': '1.2.2',
	'lodash.property': '4.4.2',
	'merge-graphql-schemas': '1.1.3',
	'subscriptions-transport-ws': '0.8.2'
});
