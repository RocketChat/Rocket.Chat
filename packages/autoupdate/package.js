Package.describe({
  summary: "Update the client when new client code is available",
  version: '1.2.4'
});

Cordova.depends({
  'cordova-plugin-file': '2.1.0',
  'cordova-plugin-file-transfer': '1.2.0'
});

Package.onUse(function (api) {
  api.use([
    'webapp',
    'check'
  ], 'server');

  api.use([
    'tracker',
    'retry'
  ], 'client');

  api.use([
    'ddp',
    'mongo',
    'underscore'
  ], ['client', 'server']);

  api.use(['http', 'random'], 'web.cordova');

  api.addFiles('autoupdate_server.js', 'server');
  api.addFiles('autoupdate_client.js', 'web.browser');
  api.addFiles('autoupdate_cordova.js', 'web.cordova');

  api.export('Autoupdate');
});
