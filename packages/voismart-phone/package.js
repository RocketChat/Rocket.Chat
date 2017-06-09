Package.describe({
	name: 'voismart:phone',
	version: '0.0.1',
	summary: 'Rocket.Chat Verto Integration'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'ecmascript',
		'coffeescript',
		'underscore',
		'less@2.7.6',
		'tracker',
		'reactive-var',
		'rocketchat:lib',
		'osxi:annyang',
		'voismart:webnotifications',
        'voismart:ngapi'
	]);

	api.use('templating', 'client');

	api.addFiles([
		'client/tabBar.coffee',
		'client/3rdparty/verto/jquery.json.min.js',
		'client/3rdparty/verto/jquery.jsonrpcclient.js',
		'client/3rdparty/verto/jquery.FSRTC.js',
		'client/3rdparty/verto/jquery.verto.js',
		'client/views/phone.html',
		'client/views/phonevideo.html',
		'client/views/phoneSettings.html',
		'client/views/phone.less',
		'client/views/phoneSettings.less',
		'client/views/phoneButtons.html',
		'client/views/phoneSearch.less',
		'client/views/phoneSearch.html',
		'client/views/phoneRegistry.html',
		'client/views/phoneRegistry.less',
		'client/phone.coffee',
		'client/phoneSettings.coffee',
		'client/phoneButtons.coffee',
	'client/phoneSearch.coffee',
		'client/tone.coffee'
	], 'client');

	api.addFiles([
		'server/settings.coffee',
		'server/methods/phoneFindUserByQ.coffee',
		'server/methods/getContacts.coffee',
		'server/methods/getPersonalRegistry.coffee',
		'server/methods/clickAndDial.coffee'
	], 'server');

	api.addFiles([], 'server');
});
