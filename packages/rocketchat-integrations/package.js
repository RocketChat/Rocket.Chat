Package.describe({
  name: 'rocketchat:integrations',
  version: '0.0.1',
  summary: 'Integrations with services and WebHooks',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use('coffeescript');
  api.use('underscore');
  api.use('rocketchat:lib@0.0.1');

  api.use('kadira:flow-router', 'client');
  api.use('templating', 'client');

  api.addFiles('lib/rocketchat.coffee', ['server','client']);
  api.addFiles('client/collection.coffee', ['client']);
  api.addFiles('client/startup.coffee', 'client');
  api.addFiles('client/route.coffee', 'client');

  // views
  api.addFiles('client/views/integrations.html', 'client');
  api.addFiles('client/views/integrations.coffee', 'client');
  api.addFiles('client/views/integrationsNew.html', 'client');
  api.addFiles('client/views/integrationsNew.coffee', 'client');
  api.addFiles('client/views/integrationsIncoming.html', 'client');
  api.addFiles('client/views/integrationsIncoming.coffee', 'client');

  // stylesheets
  api.addAssets('client/stylesheets/integrations.less', 'server');
  api.addFiles('client/stylesheets/load.coffee', 'server');

  api.addFiles('server/models/Integrations.coffee', 'server');

  // publications
  api.addFiles('server/publications/integrations.coffee', 'server');

  // methods
  api.addFiles('server/methods/addIntegration.coffee', 'server');
  api.addFiles('server/methods/updateIntegration.coffee', 'server');
  api.addFiles('server/methods/deleteIntegration.coffee', 'server');

  // api
  api.addFiles('server/api/api.coffee', 'server');

  var _ = Npm.require('underscore');
  var fs = Npm.require('fs');
  tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-integrations/i18n'), function(filename) {
    if (fs.statSync('packages/rocketchat-integrations/i18n/' + filename).size > 16) {
      return 'i18n/' + filename;
    }
  }));
  api.use('tap:i18n', ['client', 'server']);
  api.addFiles(tapi18nFiles, ['client', 'server']);
});
