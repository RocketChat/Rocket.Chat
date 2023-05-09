Package.describe({
	name: 'ostrio:cookies',
	version: '2.7.2',
	summary: 'Isomorphic bulletproof Server, Client, Browser, and Cordova cookies',
	git: 'https://github.com/veliovgroup/Meteor-Cookies',
	documentation: 'README.md',
});

Package.onUse((api) => {
	api.versionsFrom('1.4');
	api.use('ecmascript', ['client', 'server']);
	api.use('webapp', 'server');
	api.use('fetch', 'client');
	api.mainModule('cookies.js', ['client', 'server']);
});

// Package.onTest((api) => {
// 	api.use('blaze-html-templates');
// 	api.use('tinytest');
// 	api.use(['ecmascript', 'http'], ['client', 'server']);
// 	api.use(['ejson', 'webapp'], 'server');
// 	api.addFiles('cookies-tests.js', ['client', 'server']);
// });
