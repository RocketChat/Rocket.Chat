Package.describe({
  name: 'accounts-password-pg-driver',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.use([
    'simple:pg',
    'accounts-base-pg-driver',
    'ecmascript'
  ], "server");

  api.versionsFrom('1.1.0.3');
  api.addFiles('accounts-password-pg-driver.js', "server");
});
