Package.describe({
	name: 'rocketchat:katex',
	version: '0.0.1',
	summary: 'KaTeX plugin for TeX math rendering',
	git: ''
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('templating');
	api.use('rocketchat:lib');

	api.addFiles('settings.js', 'server');
	api.addFiles('katex.js');
	api.addFiles('client/style.css', 'client');

	const katexPath = 'node_modules/katex/dist/';
	api.addFiles(`${ katexPath }katex.min.css`, 'client');

	const _ = Npm.require('underscore');
	const fs = Npm.require('fs');

	const fontsPath = `${ katexPath }fonts/`;
	const fontFiles = _.map(fs.readdirSync(`packages/rocketchat-katex/${ fontsPath }`), function(filename) {
		return fontsPath + filename;
	});

	api.addAssets(fontFiles, 'client');
});
