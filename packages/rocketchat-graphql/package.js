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
		'rocketchat:lib',
		'rocketchat:api',
		'rocketchat:accounts'
	]);

	api.mainModule('server/api.js', 'server');
});

Npm.depends({
	'@accounts/graphql-api': '0.1.1',
	'apollo-client': '1.6.0',
	'cors': '2.8.3',
	'body-parser': '1.17.2',
	'express': '4.15.3',
	'graphql': '0.10.3',
	'graphql-server-express': '0.9.0',
	'graphql-subscriptions': '0.4.4',
	'graphql-tools': '1.1.0',
	'merge-graphql-schemas': '1.1.0',
	'subscriptions-transport-ws': '0.8.1'
});
