Package.describe({
	name: 'rocketchat:custom-sounds',
	version: '1.0.0',
	summary: 'Custom sounds',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'less',
		'rocketchat:file',
		'rocketchat:lib',
		'templating',
		'underscore',
		'webapp'
	]);

	api.use('kadira:flow-router', 'client');

	api.addFiles('function-isSet.js');

	api.addFiles('server/startup/custom-sounds.js', 'server');
	api.addFiles('server/startup/permissions.js', 'server');
	api.addFiles('server/startup/settings.js', 'server');

	api.addFiles('server/models/CustomSounds.js', 'server');
	api.addFiles('server/publications/customSounds.js', 'server');

	api.addFiles('admin/startup.js', 'client');
	api.addFiles('admin/adminSounds.html', 'client');
	api.addFiles('admin/adminSounds.js', 'client');
	api.addFiles('admin/adminSoundEdit.html', 'client');
	api.addFiles('admin/adminSoundInfo.html', 'client');
	api.addFiles('admin/soundEdit.html', 'client');
	api.addFiles('admin/soundEdit.js', 'client');
	api.addFiles('admin/route.js', 'client');

	api.addFiles('client/lib/custom-sounds.js', 'client');
	api.addFiles('client/models/CustomSounds.js', 'client');
});
