Package.describe({
	name: 'mizzao:autocomplete',
	summary: 'Client/server autocompletion designed for Meteor\'s collections and reactivity',
	version: '0.5.1',
	git: 'https://github.com/mizzao/meteor-autocomplete.git',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'mongo',
		'ddp',
	]);
	api.use([
		'blaze',
		'templating',
		'jquery',
		'dandv:caret-position@2.1.0-3',
	], 'client');
	api.addFiles('client/autocomplete.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
