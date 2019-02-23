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
