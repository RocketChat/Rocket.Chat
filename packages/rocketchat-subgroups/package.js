Package.describe({
	name: 'rocketchat:subgroups',
	version: '0.0.1',
	summary: 'Channel subgroups',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'jquery',
		'templating',
		'ecmascript',
		'rocketchat:lib'
	]);

	api.addFiles([
		'client/subGroup.html',
		'client/subGroup.js',
    'client/tabBar.js'
	], 'client');

	api.addFiles([
		'server/createSubGroup.js',
		'server/settings.js',
		'server/hasSubGroups.js'
	], 'server')

});
