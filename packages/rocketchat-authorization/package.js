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
    'underscore',
    'rocketchat:lib@0.0.1',
    'alanning:roles@1.2.12'
    ]);

  api.use('mongo', 'client');
  api.use('kadira:flow-router', 'client');

  api.use('templating', 'client');

  api.addFiles('lib/rocketchat.coffee', ['server','client']);
  api.addFiles('client/collection.coffee', ['client']);
  api.addFiles('client/startup.coffee', ['client']);
  api.addFiles('client/hasPermission.coffee', ['client']);
  api.addFiles('client/hasRole.coffee', ['client']);

  api.addFiles('client/route.coffee', ['client']);

  // views
  api.addFiles('client/views/permissions.html', ['client']);
  api.addFiles('client/views/permissions.coffee', ['client']);
  api.addFiles('client/views/permissionsRole.html', ['client']);
  api.addFiles('client/views/permissionsRole.coffee', ['client']);

  api.addFiles('server/models/Permissions.coffee', ['server']);

  api.addFiles('server/functions/addUsersToRoles.coffee', ['server']);
  api.addFiles('server/functions/getPermissionsForRole.coffee', ['server']);
  api.addFiles('server/functions/getRoles.coffee', ['server']);
  api.addFiles('server/functions/getRolesForUser.coffee', ['server']);
  api.addFiles('server/functions/getUsersInRole.coffee', ['server']);
  api.addFiles('server/functions/hasPermission.coffee', ['server']);
  api.addFiles('server/functions/hasRole.coffee', ['server']);
  api.addFiles('server/functions/removeUsersFromRoles.coffee', ['server']);

  // publications
  api.addFiles('server/publication.coffee', ['server']);
  api.addFiles('server/publications/roles.coffee', 'server');
  api.addFiles('server/publications/usersInRole.coffee', 'server');

  // methods
  api.addFiles('server/methods/addUserToRole.coffee', 'server');
  api.addFiles('server/methods/deleteRole.coffee', 'server');
  api.addFiles('server/methods/removeUserFromRole.coffee', 'server');
  api.addFiles('server/methods/saveRole.coffee', 'server');
  api.addFiles('server/methods/addPermissionToRole.coffee', 'server');
  api.addFiles('server/methods/removeRoleFromPermission.coffee', 'server');

  api.addFiles('server/startup.coffee', ['server']);
});
