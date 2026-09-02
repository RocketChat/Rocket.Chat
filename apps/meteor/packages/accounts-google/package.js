Package.describe({
	summary: 'Login service for Google accounts',
	version: '1.4.1',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'typescript']);
	api.use('accounts-base', 'server');
	// Export Accounts (etc) to packages using this one.
	api.imply('accounts-base', 'server');
	api.use('accounts-oauth', 'server');
	api.use('google-oauth');
	api.imply('google-oauth');

	api.addFiles('google.ts', 'server');
});
