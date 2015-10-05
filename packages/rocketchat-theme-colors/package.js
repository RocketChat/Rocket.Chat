Package.describe({
	name: 'rocketchat:theme-colors',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('coffeescript');
	api.use('webapp');
	api.use('less@2.5.0_3');

	api.addFiles('variables.coffee', 'server');
	api.addFiles('server.coffee', 'server');
	api.addFiles('client.coffee', 'client');

	// api.addFiles('assets/stylesheets/global/_variables.less', 'client');
	// api.addFiles('assets/stylesheets/utils/_colors.import.less', 'client');
	// api.addFiles('assets/stylesheets/utils/_emojione.import.less', 'client');
	// api.addFiles('assets/stylesheets/utils/_fonts.import.less', 'client');
	// api.addFiles('assets/stylesheets/utils/_keyframes.import.less', 'client');
	// api.addFiles('assets/stylesheets/utils/_lesshat.import.less', 'client');
	// api.addFiles('assets/stylesheets/utils/_preloader.import.less', 'client');
	// api.addFiles('assets/stylesheets/utils/_reset.import.less', 'client');
	// api.addFiles('assets/stylesheets/animation.css', 'client');
	// api.addFiles('assets/stylesheets/base.less', 'client');
	// api.addFiles('assets/stylesheets/fontello.css', 'client');
	// api.addFiles('assets/stylesheets/rtl.less', 'client');
	// api.addFiles('assets/stylesheets/swipebox.min.css', 'client');

	api.addAssets('assets/stylesheets/global/_variables.less', 'server');
	api.addAssets('assets/stylesheets/utils/_colors.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_emojione.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_fonts.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_keyframes.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_lesshat.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_preloader.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_reset.import.less', 'server');
	api.addAssets('assets/stylesheets/animation.css', 'server');
	api.addAssets('assets/stylesheets/base.less', 'server');
	api.addAssets('assets/stylesheets/fontello.css', 'server');
	api.addAssets('assets/stylesheets/rtl.less', 'server');
	api.addAssets('assets/stylesheets/swipebox.min.css', 'server');

	api.addAssets('assets/colors.less', 'server');

	api.export('less', 'server');
	api.export('getText', 'server');
	api.export('getAndCompile', 'server');
});

Npm.depends({
	'less': 'https://github.com/meteor/less.js/tarball/8130849eb3d7f0ecf0ca8d0af7c4207b0442e3f6'
});

Package.onTest(function(api) {

});
