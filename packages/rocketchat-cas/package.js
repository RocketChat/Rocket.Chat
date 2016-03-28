Package.describe({
  name: 'rocketchat:cas',
  summary: 'CAS support for accounts',
  version: '1.0.0',
  git: 'https://github.com/rocketchat/rocketchat-cas'
});

Package.onUse(function(api) {

  api.versionsFrom('1.0');

  // Server libs
  api.use('rocketchat:lib', 'server');
  api.use('rocketchat:logger', 'server');
  api.use('service-configuration', 'server');
  api.use('routepolicy', 'server');
  api.use('webapp', 'server');
  api.use('accounts-base', 'server');

  api.use('underscore');
  api.use('ecmascript');

  // Server files
  api.add_files('cas_rocketchat.js', 'server');
  api.add_files('cas_server.js', 'server');

  // Client files
  api.add_files('cas_client.js', 'client');

});

Npm.depends({
  cas: '0.0.3'
});
