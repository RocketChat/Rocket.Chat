Package.describe({
	name: 'rocketchat:favico',
	version: '0.0.1',
	summary: 'Favico.js for Rocket.Chat'
});

Package.onUse(function(api) {
	api.addFiles('client/favico.js', 'client');
});
