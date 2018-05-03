Package.describe({
  name: 'mizzao:timesync',
  summary: 'NTP-style time synchronization between server and client',
  version: '0.3.4',
  git: 'https://github.com/mizzao/meteor-timesync.git'
});

Package.onUse(function (api) {
  api.use([
    'check',
    'tracker',
    'http'
  ], 'client');

  api.use('webapp', 'server');

  // Our files
  api.addFiles('server/timesync-server.js', 'server');
  api.addFiles('client/timesync-client.js', 'client');

  api.export('TimeSync', 'client');
  api.export('SyncInternals', 'client', {testOnly: true} );
});

Package.onTest(function (api) {
  api.use([
    'tinytest',
    'test-helpers'
  ]);

  api.use(['tracker'], 'client');

  api.use('mizzao:timesync');

  api.addFiles('tests/client.js', 'client');
});
