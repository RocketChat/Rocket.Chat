Package.describe({
	name: 'rocketchat:graphql',
	version: '0.0.1',
	summary: 'GraphQL API',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'underscore',
		'ecmascript',
		'http',
		'rocketchat:lib',
		'rocketchat:models',
		'rocketchat:callbacks',
		'rocketchat:settings',
		'rocketchat:api',
		'rocketchat:accounts',
		'rocketchat:integrations',
		'swydo:graphql',
	]);
	api.mainModule('server/index.js', 'server');
});

Npm.depends({
	'@accounts/graphql-api': '0.2.3',
	'apollo-server-express': '1.3.6',
	cors: '2.8.4',
	graphql: '0.13.2',
	'graphql-subscriptions': '0.5.8',
	'graphql-tools': '3.0.2',
	'lodash.property': '4.4.2',
	'merge-graphql-schemas': '1.5.2',
	'subscriptions-transport-ws': '0.9.11',
});
