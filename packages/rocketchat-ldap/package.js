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

  // Commom
  api.use('tap:i18n@1.5.1');
  api.use('coffeescript');
  // Client
  api.use('templating', 'client');
  // Server
  api.use('accounts-base', 'server');
  api.use('accounts-password', 'server');


  // Commom
  api.addFiles('package-tap.i18n');
  api.addFiles('i18n/en.i18n.json');
  api.addFiles('i18n/pt.i18n.json');
  // Client
  api.addFiles('ldap_client.js', 'client');
  // Server
  api.addFiles('ldap_server.js', 'server');
  api.addFiles('config_server.coffee', 'server');

  
  api.export('LDAP', 'server');
  api.export('LDAP_DEFAULTS', 'server');
  api.export('MeteorWrapperLdapjs');
});
