Package.describe({
  summary: "Login service for Gitlab accounts",
  version: "1.0.5-plugins.0"
});

Package.onUse(function(api) {
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('accounts-oauth', ['client', 'server']);
  api.use('gitlab', ['client', 'server']);

  api.addFiles('gitlab_login_button.css', 'client');

  api.addFiles("gitlab.js");
});
