Package.describe({
	summary: 'Login service for Meteor developer accounts',
	version: '1.5.1',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'typescript']);
	api.use('accounts-base', 'server');
	// Export Accounts (etc) to packages using this one.
	api.imply('accounts-base', 'server');
	api.use('accounts-oauth', 'server');
	api.use('meteor-developer-oauth');
	api.imply('meteor-developer-oauth');

	api.addFiles('meteor-developer.ts', 'server');
});
