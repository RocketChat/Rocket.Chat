Package.describe({
  name: 'rocketchat:user-status',
  version: '1.0.0',
  summary: '',
  git: ''
});

Package.onUse(function(api) {
  api.use([
    'ecmascript',
    'templating',
    'rocketchat:lib',
    'rocketchat:ui'
  ]);

  api.addFiles('client/rocketchat.js');
});
