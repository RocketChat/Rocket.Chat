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
		'reactive-var',
		'underscore',
		'webapp'
	]);

	api.use('kadira:flow-router', 'client');

	api.addFiles('server/startup/custom-sounds.js', 'server');
	api.addFiles('server/startup/permissions.js', 'server');
	api.addFiles('server/startup/settings.js', 'server');

	api.addFiles('server/models/CustomSounds.js', 'server');
	api.addFiles('server/publications/customSounds.js', 'server');

	api.addFiles([
		'server/methods/deleteCustomSound.js',
		'server/methods/insertOrUpdateSound.js',
		'server/methods/listCustomSounds.js',
		'server/methods/uploadCustomSound.js'
	], 'server');

	api.addFiles('assets/stylesheets/customSoundsAdmin.less', 'client');

	api.addFiles('admin/startup.js', 'client');
	api.addFiles('admin/adminSounds.html', 'client');
	api.addFiles('admin/adminSounds.js', 'client');
	api.addFiles('admin/adminSoundEdit.html', 'client');
	api.addFiles('admin/adminSoundInfo.html', 'client');
	api.addFiles('admin/soundEdit.html', 'client');
	api.addFiles('admin/soundEdit.js', 'client');
	api.addFiles('admin/soundInfo.html', 'client');
	api.addFiles('admin/soundInfo.js', 'client');
	api.addFiles('admin/route.js', 'client');

	api.addFiles('client/lib/CustomSounds.js', 'client');
	api.addFiles('client/models/CustomSounds.js', 'client');
	api.addFiles('client/notifications/updateCustomSound.js', 'client');
	api.addFiles('client/notifications/deleteCustomSound.js', 'client');
});
