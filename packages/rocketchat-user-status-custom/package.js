Package.describe({
	name: 'rocketchat:user-status-custom',
	version: '1.0.0',
	summary: '',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:file',
		'rocketchat:lib',
		'templating',
		'webapp'
	]);

	api.use('kadira:flow-router', 'client');

	api.addFiles([
		'server/models/CustomUserStatus.js',
		'server/publications/fullUserStatusData.js',
		'server/methods/insertOrUpdateUserStatus.js',
		'server/methods/listCustomUserStatus.js',
		'server/methods/deleteCustomUserStatus.js',
	], 'server');

	api.addFiles([
		'client/admin/startup.js',
		'client/admin/route.js',
		'client/admin/adminUserStatus.html',
		'client/admin/adminUserStatus.js',
		'client/admin/adminUserStatusEdit.html',
		'client/admin/adminUserStatusInfo.html',
		'client/admin/userStatusEdit.html',
		'client/admin/userStatusEdit.js',
		'client/admin/userStatusPreview.html',
		'client/admin/userStatusInfo.html',
		'client/admin/userStatusInfo.js',
		'client/models/CustomUserStatus.js',
		'client/lib/customUserStatus.js',
		'client/notifications/deleteCustomUserStatus.js',
		'client/notifications/updateCustomUserStatus.js'
	], 'client');
});