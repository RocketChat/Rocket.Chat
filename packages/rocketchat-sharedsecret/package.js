Package.describe({
	name: 'rocketchat:sharedsecret',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib'
	]);

	api.use(['jparker:crypto-aes'], ['server','client']);

	api.addFiles('sharedsecret.coffee', ['server','client']);
});
