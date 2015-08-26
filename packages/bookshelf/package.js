Package.describe({
  name: 'simple:bookshelf',
  version: '0.0.1',
  documentation: null
});

Npm.depends({
  bookshelf: '0.8.1',
  knex: '0.8.6',
  exposify: '0.4.3',
  bluebird: '2.9.34'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');
  api.use('ecmascript');
  api.use('underscore');

  api.use('cosmos:browserify@0.5.0');
  api.addFiles('sync-promise.browserify.js', 'client');
  api.addFiles('bookshelf.browserify.js', 'client');
  api.addFiles('bookshelf.browserify.options.json', 'client');

  api.addFiles('knex.js');
  api.addFiles('bookshelf.js');

  api.export(['Bookshelf', 'Knex']);
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('simple:bookshelf');
  api.addFiles('knex_tests.js', 'client');
});
