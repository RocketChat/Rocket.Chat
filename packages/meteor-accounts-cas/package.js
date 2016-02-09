Package.describe({
  summary: "CAS support for accounts",
  version: "0.0.2",
  name: "atoy40:accounts-cas",
  git: "https://github.com/atoy40/meteor-accounts-cas"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0');
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
