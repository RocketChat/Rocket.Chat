Package.describe({
	name: 'rocketchat:custom-sounds',
	version: '1.0.0',
	summary: 'Custom sounds',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:file',
		'rocketchat:lib',
		'templating',
		'reactive-var',
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

	api.addFiles('assets/stylesheets/customSoundsAdmin.css', 'client');

	api.addFiles('client/admin/startup.js', 'client');
	api.addFiles('client/admin/adminSounds.html', 'client');
	api.addFiles('client/admin/adminSounds.js', 'client');
	api.addFiles('client/admin/adminSoundEdit.html', 'client');
	api.addFiles('client/admin/adminSoundInfo.html', 'client');
	api.addFiles('client/admin/soundEdit.html', 'client');
	api.addFiles('client/admin/soundEdit.js', 'client');
	api.addFiles('client/admin/soundInfo.html', 'client');
	api.addFiles('client/admin/soundInfo.js', 'client');
	api.addFiles('client/admin/route.js', 'client');

	api.addFiles('client/lib/CustomSounds.js', 'client');
	api.addFiles('client/models/CustomSounds.js', 'client');
	api.addFiles('client/notifications/updateCustomSound.js', 'client');
	api.addFiles('client/notifications/deleteCustomSound.js', 'client');
});
