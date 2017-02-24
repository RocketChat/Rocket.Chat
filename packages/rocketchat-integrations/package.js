Package.describe({
	name: 'rocketchat:integrations',
	version: '0.0.1',
	summary: 'Integrations with services and WebHooks',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('coffeescript');
	api.use('underscore');
	api.use('ecmascript');
	api.use('babel-compiler');
	api.use('rocketchat:lib');
	api.use('rocketchat:authorization');
	api.use('rocketchat:api');
	api.use('rocketchat:theme');
	api.use('rocketchat:logger');
	api.use('less');

	api.use('kadira:flow-router', 'client');
	api.use('templating', 'client');

	api.addFiles('lib/rocketchat.js', ['server', 'client']);

	// items
	api.addFiles('client/collections.js', 'client');
	api.addFiles('client/startup.js', 'client');
	api.addFiles('client/route.js', 'client');

	// views
	api.addFiles('client/views/integrations.html', 'client');
	api.addFiles('client/views/integrations.js', 'client');
	api.addFiles('client/views/integrationsNew.html', 'client');
	api.addFiles('client/views/integrationsNew.js', 'client');
	api.addFiles('client/views/integrationsIncoming.html', 'client');
	api.addFiles('client/views/integrationsIncoming.js', 'client');
	api.addFiles('client/views/integrationsOutgoing.html', 'client');
	api.addFiles('client/views/integrationsOutgoing.js', 'client');
	api.addFiles('client/views/integrationsOutgoingHistory.html', 'client');
	api.addFiles('client/views/integrationsOutgoingHistory.js', 'client');

	// stylesheets
	api.addFiles('client/stylesheets/integrations.less', 'client');

	api.addFiles('server/logger.js', 'server');
	api.addFiles('server/lib/validation.js', 'server');

	api.addFiles('server/models/Integrations.js', 'server');
	api.addFiles('server/models/IntegrationHistory.js', 'server');

	// publications
	api.addFiles('server/publications/integrations.js', 'server');
	api.addFiles('server/publications/integrationHistory.js', 'server');

	// methods
	api.addFiles('server/methods/incoming/addIncomingIntegration.js', 'server');
	api.addFiles('server/methods/incoming/updateIncomingIntegration.js', 'server');
	api.addFiles('server/methods/incoming/deleteIncomingIntegration.js', 'server');
	api.addFiles('server/methods/outgoing/addOutgoingIntegration.js', 'server');
	api.addFiles('server/methods/outgoing/updateOutgoingIntegration.js', 'server');
	api.addFiles('server/methods/outgoing/replayOutgoingIntegration.js', 'server');
	api.addFiles('server/methods/outgoing/deleteOutgoingIntegration.js', 'server');
	api.addFiles('server/methods/clearIntegrationHistory.js', 'server');

	// api
	api.addFiles('server/api/api.coffee', 'server');

	api.addFiles('server/lib/triggerHandler.js', 'server');
	api.addFiles('server/triggers.js', 'server');

	api.addFiles('server/processWebhookMessage.js', 'server');
});
