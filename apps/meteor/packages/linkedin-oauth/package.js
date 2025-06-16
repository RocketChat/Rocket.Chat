Package.describe({
	name: 'pauli:linkedin-oauth',
	version: '6.0.0',
	summary: 'LinkedIn OAuth flow, use with Meteor 1.6.1 & up',
	git: 'https://github.com/PoBuchi/pauli-linkedin-oauth',
	documentation: 'README.md',
});

Package.onUse((api) => {
	api.use('ecmascript');
	api.use('oauth2', ['client', 'server']);
	api.use('oauth', ['client', 'server']);
	api.use('fetch', ['server']);
	api.use('random', 'client');
	api.use('service-configuration', ['client', 'server']);

	api.mainModule('linkedin-client.js', 'client');
	api.mainModule('linkedin-server.js', 'server');
});
