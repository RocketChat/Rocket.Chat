Package.describe({
	name: 'rocketchat:mailer',
	version: '0.0.1',
	summary: 'Mailer for Rocket.Chat'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'ddp-rate-limiter',
		'kadira:flow-router',
		'rocketchat:lib@0.0.1',
		'rocketchat:authorization@0.0.1'
	]);

	api.addFiles('lib/RocketMailer.coffee');

	api.addFiles([
		'client/startup.coffee',
		'client/router.coffee',
		'client/views/rocketMailer.html',
		'client/views/rocketMailer.coffee',
		'client/views/rocketMailerUnsubscribe.html'
	], 'client');

	api.addFiles([
		'server/startup.coffee',
		'server/models/Users.coffee',
		'server/functions/sendMail.coffee',
		'server/functions/unsubscribe.coffee',
		'server/methods/sendMail.coffee',
		'server/methods/unsubscribe.coffee'
	], 'server');

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	api.use('templating', 'client');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-mailer/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-mailer/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n@1.6.1', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);

	api.export('RocketMailer');
});
