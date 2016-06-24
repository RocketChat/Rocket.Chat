Package.describe({
	name: 'voismart:ngpresence',
	version: '0.0.1',
	summary: 'Orchestra NG presence integration',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'tracker',
		'jzwzz:amqplib',
		'rocketchat:lib'
	]);

	api.addFiles([
		'server.coffee'
	], ['server']);

});
