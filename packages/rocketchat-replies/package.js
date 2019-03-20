Package.describe({
	name: 'rocketchat:replies',
	version: '0.0.1',
	summary: 'Rocketchat replies',
	git: '',
});

Package.onUse(function (api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:logger',
		'kadira:flow-router',
	]);

	api.addFiles([
		'client/replies/replies.html',
		'client/replies/replies.js',
		'client/style/style.css',
	], 'client');

});
