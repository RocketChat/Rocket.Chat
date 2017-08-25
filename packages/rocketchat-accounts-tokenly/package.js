Package.describe({
	name: 'rocketchat:accounts-tokenly',
	documentation: 'README.md',
	summary: 'Login service for Tokenly accounts',
	version: '0.0.1'
});

Package.onUse(function(api) {
	api.use('accounts-base', ['client', 'server']);
	api.imply('accounts-base', ['client', 'server']);

	api.use('accounts-oauth', ['client', 'server']);
	api.use('rocketchat:tokenly-oauth');
	api.imply('rocketchat:tokenly-oauth');

	api.use(
		['client', 'server'],
		{ weak: true }
	);
	api.addFiles('tokenly.js');
});
