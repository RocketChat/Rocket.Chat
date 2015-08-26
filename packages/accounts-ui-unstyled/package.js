Package.describe({
  summary: "Unstyled version of login widgets",
  version: "1.1.8-rc.0"
});

Package.onUse(function (api) {
  api.use(['tracker', 'service-configuration', 'accounts-base',
           'underscore', 'templating', 'session', 'jquery'], 'client');
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);

  // Allow us to call Accounts.oauth.serviceNames, if there are any OAuth
  // services.
  api.use('accounts-oauth', {weak: true});
  // Allow us to directly test if accounts-password (which doesn't use
  // Accounts.oauth.registerService) exists.
  api.use('accounts-password', {weak: true});

  api.addFiles([
    'accounts_ui.js',

    'login_buttons.html',
    'login_buttons_single.html',
    'login_buttons_dropdown.html',
    'login_buttons_dialogs.html',

    'login_buttons_session.js',

    'login_buttons.js',
    'login_buttons_single.js',
    'login_buttons_dropdown.js',
    'login_buttons_dialogs.js'], 'client');

  // The less source defining the default style for accounts-ui. Just adding
  // this package doesn't actually apply these styles; they need to be
  // `@import`ed from some non-import less file.  The accounts-ui package does
  // that for you, or you can do it in your app.
  api.use('less');
  api.addFiles('login_buttons.import.less');
});

Package.onTest(function (api) {
  api.use('accounts-ui-unstyled');
  api.use('tinytest');
  api.addFiles('accounts_ui_tests.js', 'client');
});
