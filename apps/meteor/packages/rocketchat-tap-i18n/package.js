Package.describe({
	name: 'rocketchat:tap-i18n',
	summary: 'A comprehensive internationalization solution for Meteor',
	version: '3.0.0',
	git: 'https://github.com/TAPevents/tap-i18n',
});

const both = ['server', 'client'];
const server = 'server';
const client = 'client';

Package.onUse(function (api) {
	api.versionsFrom('2.5');

	api.use('coffeescript', both);
	api.use('underscore', both);
	api.use('ecmascript', both);
	api.use('meteor', both);
	api.use('webapp', both);
	api.use('tracker', both);
	api.use('session', client);
	api.use('jquery@3.0.0', client);
	api.use('templating@1.4.1', client);

	api.use('raix:eventemitter@1.0.0', both);

	// load and init TAPi18next
	api.addFiles('lib/tap_i18next/tap_i18next-1.7.3.js', both);
	api.export('TAPi18next');

	api.mainModule('client.js', client);
	api.mainModule('server.js', server);

	api.export('TAPi18n');
});

Npm.depends({
	'connect': '2.30.2',
	'connect-route': '0.1.5',
});

Package.registerBuildPlugin({
	name: 'tap-i18n-compiler',
	use: ['coffeescript', 'underscore', 'mdg:validation-error@0.5.1', 'aldeed:simple-schema@1.5.4', 'check@1.3.1', 'templating@1.4.1'],
	npmDependencies: {
		yamljs: '0.3.0',
	},
	sources: [
		'lib/globals.js',

		'lib/plugin/etc/language_names.js',

		'lib/plugin/compiler_configuration.coffee',

		'lib/plugin/helpers/helpers.coffee',
		'lib/plugin/helpers/load_json.coffee',
		'lib/plugin/helpers/load_yml.coffee',
		'lib/plugin/helpers/compile_step_helpers.coffee',

		'lib/plugin/compilers/share.coffee',
		'lib/plugin/compilers/i18n.coffee',
		'lib/plugin/compilers/project-tap.i18n.coffee',
		'lib/plugin/compilers/package-tap.i18n.coffee',
		'lib/plugin/compilers/i18n.generic_compiler.coffee',
		'lib/plugin/compilers/i18n.json.coffee',
		'lib/plugin/compilers/i18n.yml.coffee',
	],
});
