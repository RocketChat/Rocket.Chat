Package.describe({
	name: 'dbs:common',
	version: '0.0.1',
	summary: 'Basic customizing for db',  // Brief, one-line summary of the package.
	git: '',
	documentation: ''
});


Package.onUse(function(api) {
	api.use(['ecmascript', 'underscore']);
	api.use('templating', 'client'); //needed in order to be able to register global helpers on the Template-object

	api.addFiles('lib/core.js');
	api.addFiles('lib/duration.js', 'client');
	api.addFiles('lib/testing.js', 'server');
	api.addFiles('client/lib/globalTemplateHelpers.js', 'client');

	api.export('_dbs');
});
