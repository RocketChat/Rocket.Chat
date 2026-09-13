Package.describe({
	summary: 'Login service for Facebook accounts',
	version: '1.3.4',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'typescript']);
	api.use('accounts-base', 'server');
	// Export Accounts (etc) to packages using this one.
	api.imply('accounts-base', 'server');
	api.use('accounts-oauth', 'server');
	api.use('facebook-oauth', 'server');
	api.imply('facebook-oauth', 'server');

	api.addFiles('facebook.ts', 'server');
});
