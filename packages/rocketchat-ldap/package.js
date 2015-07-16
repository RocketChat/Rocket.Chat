Package.describe({
  name: 'rocketchat:ldap',
  version: '0.0.1',
  summary: 'Accounts login handler for LDAP using ldapjs from npm',
  git: 'https://github.com/rocketchat/rocketchat-ldap'
});

Npm.depends({
  ldapjs: "0.7.1", 
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');

  api.use(["tap:i18n@1.5.1"], ["client", "server"]);
  api.add_files("package-tap.i18n", ["client", "server"]);

  api.use(['templating'], 'client');

  api.use(['accounts-base', 'accounts-password'], 'server');

  api.addFiles(['ldap_client.js'], 'client');
  api.addFiles(['ldap_server.js', 'lib/ldapjs.js'], 'server');

  api.add_files([
    "i18n/en.i18n.json",
    "i18n/pt.i18n.json"
  ], ["client", "server"]);

  api.export('LDAP', 'server');
  api.export('LDAP_DEFAULTS', 'server');
  api.export([
    'MeteorWrapperLdapjs'
  ]);
});

