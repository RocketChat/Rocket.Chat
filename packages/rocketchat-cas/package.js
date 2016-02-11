Package.describe({
  name: "rocketchat:cas",
  summary: "CAS support for accounts",
  version: "1.0.1",
  git: "https://github.com/rocketchat/rocketchat-cas"
});

Package.onUse(function(api) {

  api.versionsFrom('1.1.0.2');

  // Server libs
  api.use('rocketchat:lib', 'server');
  api.use('service-configuration', 'server');
 
  // Server files
  api.add_files('cas_rocketchat.js', 'server');

  api.use('routepolicy', 'server');
  api.use('webapp', 'server');
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('underscore');


  api.add_files('cas_client.js', 'client');
  api.add_files('cas_server.js', 'server');

});

Npm.depends({
  cas: "0.0.3"
});
