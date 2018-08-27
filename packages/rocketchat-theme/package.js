Package.describe({
	name: 'rocketchat:theme',
	version: '0.0.1',
	summary: '',
	git: '',
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('rocketchat:logger');
	api.use('rocketchat:assets');
	// api.use('juliancwirko:postcss');
	api.use('ecmascript');
	api.use('less');
	api.use('webapp');
	api.use('webapp-hashing');
	api.use('templating', 'client');

	// Compiled stylesheets
	// api.addFiles('client/main.css', 'server');

	// Server side files
	api.addFiles('server/server.js', 'server');
	api.addFiles('server/variables.js', 'server');

	// Colorpicker
	api.addFiles('client/vendor/jscolor.js', 'client');

	// Photoswipe
	api.addFiles('client/vendor/photoswipe.css', 'client');

	api.addAssets('client/imps/general/variables.css', 'server');
	// Fontello
	api.addFiles('client/vendor/fontello/css/fontello.css', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.eot', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.svg', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.ttf', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.woff', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.woff2', 'client');

	// Run-time stylesheets
	api.addAssets('server/colors.less', 'server');

	api.addFiles('client/imps/general/reset.css', 'client');
	api.addFiles('client/imps/general/variables.css', 'client');
	api.addFiles('client/imps/general/base_old.css', 'client');
	api.addFiles('client/imps/general/base.css', 'client');
	api.addFiles('client/imps/general/animations.css', 'client');
	api.addFiles('client/imps/general/apps.css', 'client');

	api.addFiles('client/imps/general/forms.css', 'client');
	api.addFiles('client/imps/forms/button.css', 'client');
	api.addFiles('client/imps/forms/input.css', 'client');
	api.addFiles('client/imps/forms/select.css', 'client');
	api.addFiles('client/imps/forms/popup-list.css', 'client');
	api.addFiles('client/imps/forms/select-avatar.css', 'client');
	api.addFiles('client/imps/forms/switch.css', 'client');
	api.addFiles('client/imps/forms/tags.css', 'client');
	api.addFiles('client/imps/forms/checkbox.css', 'client');

	api.addFiles('client/imps/general/typography.css', 'client');

	api.addFiles('client/imps/components/sidebar/sidebar.css', 'client');
	api.addFiles('client/imps/components/sidebar/sidebar-header.css', 'client');
	api.addFiles('client/imps/components/sidebar/sidebar-item.css', 'client');
	api.addFiles('client/imps/components/sidebar/sidebar-flex.css', 'client');
	api.addFiles('client/imps/components/sidebar/toolbar.css', 'client');
	api.addFiles('client/imps/components/sidebar/rooms-list.css', 'client');

	api.addFiles('client/imps/components/setup-wizard.css', 'client');
	api.addFiles('client/imps/components/flex-nav.css', 'client');
	api.addFiles('client/imps/components/header.css', 'client');
	api.addFiles('client/imps/components/memberlist.css', 'client');
	api.addFiles('client/imps/components/main-content.css', 'client');
	api.addFiles('client/imps/components/message-box.css', 'client');
	api.addFiles('client/imps/components/avatar.css', 'client');
	api.addFiles('client/imps/components/badge.css', 'client');
	api.addFiles('client/imps/components/popover.css', 'client');
	api.addFiles('client/imps/components/alerts.css', 'client');
	api.addFiles('client/imps/components/popout.css', 'client');
	api.addFiles('client/imps/components/modal.css', 'client');
	api.addFiles('client/imps/components/tooltip.css', 'client');
	api.addFiles('client/imps/components/slider.css', 'client');
	api.addFiles('client/imps/components/chip.css', 'client');
	api.addFiles('client/imps/components/messages.css', 'client');
	api.addFiles('client/imps/components/contextual-bar.css', 'client');
	api.addFiles('client/imps/components/emojiPicker.css', 'client');
	api.addFiles('client/imps/components/table.css', 'client');
	api.addFiles('client/imps/components/tabs.css', 'client');

	api.addFiles('client/imps/components/modal/full-modal.css', 'client');
	api.addFiles('client/imps/components/modal/create-channel.css', 'client');
	api.addFiles('client/imps/components/modal/directory.css', 'client');

	api.addFiles('client/imps/components/userInfo.css', 'client');

	api.addFiles('client/imps/general/rtl.css', 'client');

});
