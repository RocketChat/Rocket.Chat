Package.describe({
  name: "utilities:avatar",
  summary: "Consolidated user avatar template (twitter, facebook, gravatar, etc.)",
  version: "0.7.10",
  git: "https://github.com/bengott/meteor-avatar"
});

Package.onUse(function(api) {
  api.versionsFrom(['METEOR@0.9.4.1', 'METEOR@1.1.0.1']);
  api.use(['templating', 'stylus', 'reactive-var'], ['client']);
  api.use(['underscore', 'jparker:gravatar@0.3.1'], ['client', 'server']);
  api.addFiles(
    [
      'template/avatar.html',
      'template/avatar.js',
      'template/avatar.styl'
    ],
    ['client']
  );
  api.addFiles(
    [
      'utils.js',
      'export.js',
      'helpers.js',
      'default.png'
    ],
    ['client', 'server']
  );
  api.export('Avatar');
});
