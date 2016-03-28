Package.describe({
	name: 'rocketchat:theme',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('rocketchat:lib');
	api.use('rocketchat:logger');
	api.use('coffeescript');
	api.use('underscore');
	api.use('webapp');
	api.use('webapp-hashing');


	api.addFiles('server/server.coffee', 'server');
	api.addFiles('server/variables.coffee', 'server');

	api.addFiles('client/minicolors/jquery.minicolors.css', 'client');
	api.addFiles('client/minicolors/jquery.minicolors.js', 'client');


	api.addAssets('assets/stylesheets/global/_variables.less', 'server');
	api.addAssets('assets/stylesheets/utils/_colors.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_keyframes.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_lesshat.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_preloader.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_reset.import.less', 'server');
	api.addAssets('assets/stylesheets/utils/_chatops.less', 'server');
	api.addAssets('assets/stylesheets/animation.css', 'server');
	api.addAssets('assets/stylesheets/base.less', 'server');
	api.addAssets('assets/stylesheets/fontello.css', 'server');
	api.addAssets('assets/stylesheets/rtl.less', 'server');
	api.addAssets('assets/stylesheets/swipebox.min.css', 'server');

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	api.use('templating', 'client');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-theme/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-theme/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});

Npm.depends({
	'less': 'https://github.com/meteor/less.js/tarball/8130849eb3d7f0ecf0ca8d0af7c4207b0442e3f6',
	'less-plugin-autoprefix': '1.4.2'
});
