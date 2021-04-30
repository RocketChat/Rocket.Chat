Package.describe({
    name: 'react-fast-refresh',
    version: '0.1.0',
    summary: 'Automatically update React components with HMR',
    documentation: 'README.md',
    devOnly: true
  });
  
  Npm.depends({
    'react-refresh': '0.9.0',
     semver: '7.3.4'
  });
  
  Package.onUse(function (api) {
    api.export('ReactFastRefresh');
    api.use('modules');
    api.addFiles('server.js', 'server');
    api.addFiles('client-runtime.js', 'web.browser');
    api.use('hot-module-replacement', { weak: true });
  });