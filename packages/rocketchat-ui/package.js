Package.describe({
	name: 'rocketchat:ui',
	version: '0.1.0',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'accounts-base',
		'mongo',
		'session',
		'jquery',
		'tracker',
		'reactive-var',
		'ecmascript',
		'templating',
		'kadira:flow-router',
		'kadira:blaze-layout',
		'rocketchat:ui-master',
		'rocketchat:push',
		'rocketchat:utils',
		'rocketchat:emoji',
		'rocketchat:notifications',
		'rocketchat:ui-utils',
		'rocketchat:models',
		'raix:ui-dropped-event',
		'rocketchat:lazy-load',
		'rocketchat:e2e',
		'mizzao:autocomplete',
		'rocketchat:file-upload',
		'konecty:user-presence',
		'rocketchat:webrtc',
		'rocketchat:markdown',
		'rocketchat:emoji',
	]);
	api.mainModule('client/index.js', 'client');
});
