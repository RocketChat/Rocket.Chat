Package.describe({
	name: 'ostrio:cookies',
	version: '2.7.2',
	summary: 'Isomorphic bulletproof Server, Client, Browser, and Cordova cookies',
	git: 'https://github.com/veliovgroup/Meteor-Cookies',
	documentation: 'README.md',
});

Package.onUse((api) => {
	api.use('ecmascript', ['client', 'server']);
	api.use('webapp', 'server');
	api.use('fetch', 'client');
	api.mainModule('cookies.js', ['client', 'server']);
});
