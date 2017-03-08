Package.describe({
  name: 'assistify:help-request',
  version: '0.0.1',
  summary: 'Adds rooms which are to be closed once the initial question has been resolved',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function (api) {
	api.versionsFrom('1.2.1');
	api.use(['ecmascript', 'underscore', 'coffeescript', 'less@2.5.1']);
	api.use(['assistify']);
	api.use('rocketchat:lib'); //In order to be able to attach to RocketChat-Global
	api.use('rocketchat:livechat'); //Due to external messages
	api.use(['nimble:restivus', 'rocketchat:authorization', 'rocketchat:api'], 'server');
	api.use('templating', 'client');

	api.addFiles('help-request.js', 'server');
	api.addFiles('server/types.js', 'server');
	api.addFiles('server/api.js', 'server');
	api.addFiles('server/routes.js', 'server');
	api.addFiles('config.js', 'server');

	// Models
	api.addFiles('server/models/Users.js', ['server', 'client']);
	api.addFiles('server/models/Rooms.js', ['server', 'client']);
	api.addFiles('server/models/HelpRequests.js', ['server', 'client']);
	api.addFiles('server/models/LivechatExternalMessage.js', ['server', 'client']);

	api.addFiles('server/publications/Rooms.js', 'server');
	api.addFiles('server/publications/HelpRequests.js', 'server');

	//Methods
	api.addFiles('server/methods/helpRequestByRoomId.js', 'server');
	api.addFiles('server/methods/closeHelpRequest.js', 'server');

	// Hooks
	api.addFiles('server/hooks/sendMessageToKnowledgeAdapter.js', 'server');

	//Templates
	api.addFiles('client/views/HelpRequestContext.html', 'client');
	api.addFiles('client/views/HelpRequestContext.js', 'client');
	api.addFiles('client/views/HelpRequestContextParameter.html', 'client');
	api.addFiles('client/views/HelpRequestContextParameter.js', 'client');
	api.addFiles('client/views/HelpRequestActions.html', 'client');
	api.addFiles('client/views/HelpRequestActions.js', 'client');

	//Assets
	api.addAssets('assets/stylesheets/helpRequestContext.less', 'server'); //has to be done on the server, it exposes the completed css to the client

	//i18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/assistify-help-request/i18n'), function(filename) {
		return 'i18n/' + filename;
	}));
	api.addFiles(tapi18nFiles);

	api.use('tap:i18n');

	//global exports
	api.export('helpRequest');
});
