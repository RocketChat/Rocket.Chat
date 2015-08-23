Package.describe({
  summary: "Gitlab OAuth flow",
  version: "1.1.4-plugins.0"
});

Package.onUse(function(api) {
  api.use('oauth2', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('http', ['server']);
  api.use('underscore', 'client');
  api.use('templating', 'client');
  api.use('random', 'client');
  api.use('service-configuration', ['client', 'server']);

  api.export('Gitlab');

  api.addFiles(
    ['gitlab_configure.html', 'gitlab_configure.js'],
    'client');

  api.addFiles(['gitlab_common.js','gitlab_server.js'], 'server');
  api.addFiles(['gitlab_common.js','gitlab_client.js'], 'client');
});
