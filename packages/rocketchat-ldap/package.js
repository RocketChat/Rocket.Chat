Package.describe({
  name: 'rocketchat:ldap',
  version: '0.0.1',
  summary: 'Accounts login handler for LDAP using ldapjs from npm',
  git: 'https://github.com/rocketchat/rocketchat-ldap'
});

Npm.depends({
  ldapjs: "1.0.0",
});

// Loads all i18n.json files into tapi18nFiles
var _ = Npm.require('underscore');
var fs = Npm.require('fs');
tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-ldap/i18n'), function(filename) {
    if (fs.statSync('packages/rocketchat-ldap/i18n/' + filename).size > 16) {
        return 'i18n/' + filename;
    }
}));

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');

  // Commom
  api.use('rocketchat:logger');
  api.use('rocketchat:lib');
  api.use('tap:i18n');
  api.use('yasaricli:slugify');
  api.use('coffeescript');
  api.use('ecmascript');
  api.use('sha');
  // Client
  api.use('templating', 'client');
  // Server
  api.use('accounts-base', 'server');
  api.use('accounts-password', 'server');


  // Common
  // TAP
  api.addFiles('package-tap.i18n');

  // Client
  api.addFiles('ldap_client.js', 'client');
  // Server
  api.addFiles('ldap_server.js', 'server');
  api.addFiles('config_server.coffee', 'server');
  api.addFiles('server/ldap.js', 'server');

  api.addFiles(tapi18nFiles);

  api.export('LDAP', 'server');
  api.export('LDAP2', 'server');
  api.export('LDAP_DEFAULTS', 'server');
  api.export('MeteorWrapperLdapjs');
});
