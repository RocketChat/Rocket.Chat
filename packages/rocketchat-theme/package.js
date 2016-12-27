Package.describe({
	name: 'rocketchat:theme',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('rocketchat:logger');
	api.use('rocketchat:assets');
	api.use('coffeescript');
	api.use('ecmascript');
	api.use('underscore');
	api.use('webapp');
	api.use('webapp-hashing');

	api.use('templating', 'client');

	// Server side files
	api.addFiles('server/server.coffee', 'server');
	api.addFiles('server/variables.coffee', 'server');

	// Client side files
	api.addFiles('client/minicolors/jquery.minicolors.css', 'client');
	api.addFiles('client/minicolors/jquery.minicolors.js', 'client');

	// Vendor stylesheets
	api.addAssets('assets/stylesheets/vendor/animation.css', 'server');
	api.addAssets('assets/stylesheets/vendor/fontello.css', 'server');
	api.addAssets('assets/stylesheets/vendor/swipebox.css', 'server');

	// Custom stylesheets
	api.addAssets('assets/stylesheets/_core.import.less', 'server');
	api.addAssets('assets/stylesheets/base.less', 'server');
	api.addAssets('assets/stylesheets/blocks/_general-rtl.import.less', 'server');
	api.addAssets('assets/stylesheets/blocks/_general.import.less', 'server');
	api.addAssets('assets/stylesheets/global/_variables.import.less', 'server');
	api.addAssets('assets/stylesheets/mixins/_blink.import.less', 'server');
	api.addAssets('assets/stylesheets/mixins/_buttonColors.import.less', 'server');
	api.addAssets('assets/stylesheets/mixins/_custom-scroll.import.less', 'server');
	api.addAssets('assets/stylesheets/mixins/_gradient.import.less', 'server');
	api.addAssets('assets/stylesheets/mixins/_input-shade.import.less', 'server');
	api.addAssets('assets/stylesheets/mixins/_linkColors.import.less', 'server');
	api.addAssets('assets/stylesheets/rtl.less', 'server');
	api.addAssets('assets/stylesheets/utils/_chatops.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_colors.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_forms.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_keyframes.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_preloader.import.less', 'server');
	api.addAssets('assets/stylesheets/variables/_variables.import.less', 'server');
	api.addAssets('assets/stylesheets/vendor/_reset.import.less', 'server');
});

Npm.depends({
	'less': 'https://github.com/meteor/less.js/tarball/8130849eb3d7f0ecf0ca8d0af7c4207b0442e3f6',
	'less-plugin-autoprefix': '1.4.2'
});
