Package.describe({
  name: 'rocketchat:ldap',
  version: '0.0.1',
  summary: 'Accounts login handler for LDAP using ldapjs from npm',
  git: 'https://github.com/rocketchat/rocketchat-ldap'
});

Npm.depends({
  ldapjs: "1.0.0",
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');

  api.use('rocketchat:logger');
  api.use('rocketchat:lib');
  api.use('tap:i18n');
  api.use('yasaricli:slugify');
  api.use('coffeescript');
  api.use('ecmascript');
  api.use('sha');

  api.use('templating', 'client');

  api.use('accounts-base', 'server');
  api.use('accounts-password', 'server');

  api.addFiles('client/loginHelper.js', 'client');

  api.addFiles('server/ldap.js', 'server');
  api.addFiles('server/loginHandler.js', 'server');
  api.addFiles('server/settings.coffee', 'server');

  api.export('LDAP', 'server');
});
