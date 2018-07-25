Package.describe({
	name: 'rocketchat:audio',
	version: '0.0.1',
	summary: 'Audio recording and encoding',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:logger'
	]);

	api.addFiles('client/recorder.js', 'client');
	api.addFiles('client/audioRecorder.js', 'client');
	api.addFiles('client/recognizer.js', 'client');

	api.addFiles('server/index.js', 'server');
});
