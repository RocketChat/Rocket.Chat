Package.describe({
  name: 'rocketchat:authorization',
  version: '0.0.1',
  summary: 'Role based authorization of actions',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use([
    'coffeescript',
    'rocketchat:lib@0.0.1',
    'alanning:roles@1.2.12'
    ]);

  api.use('templating', 'client');

  api.addFiles('lib/rocketchat.coffee', ['server','client']);
  api.addFiles('client/collection.coffee', ['client']);
  api.addFiles('client/startup.coffee', ['client']);
  api.addFiles('client/hasPermission.coffee', ['client']);
  api.addFiles('client/hasRole.coffee', ['client']);


  api.addFiles('server/models/Permissions.coffee', ['server']);

  api.addFiles('server/functions/addUsersToRoles.coffee', ['server']);
  api.addFiles('server/functions/getPermissionsForRole.coffee', ['server']);
  api.addFiles('server/functions/getRoles.coffee', ['server']);
  api.addFiles('server/functions/getRolesForUser.coffee', ['server']);
  api.addFiles('server/functions/getUsersInRole.coffee', ['server']);
  api.addFiles('server/functions/hasPermission.coffee', ['server']);
  api.addFiles('server/functions/hasRole.coffee', ['server']);
  api.addFiles('server/functions/removeUsersFromRoles.coffee', ['server']);

  api.addFiles('server/publication.coffee', ['server']);
  api.addFiles('server/startup.coffee', ['server']);
});
