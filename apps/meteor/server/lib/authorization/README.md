Supports role or permission based authorization, and defines the association between them.

A user is associated with role(s), and a role is associated with permission(s).  This package depends on alanning:roles for the role/user association, while the role/permission association is handled internally.  Thus, the underlying alanning:roles has no concept of a permission or the association between a role and permission.

Authorization checks can be done based on a role or permission.  However, permission based checks are preferred because they loosely associate an action with a role.  For example:

```
# permission based check
if hasPermission(userId, 'edit-message') ...
	# action is loosely associated to role via permission.  Thus action can be revoked
	# at runtime by removing the permission for user's role instead of modifying the action code.

# role based check
if hasRole(userId, 'admin')
if hasAnyRole(userId, ['admin','site-moderator','moderator'])
	# action is statically associated with the role
	# action code has to be modified to add/remove role authorization

```

Usage:
```
# assign user to admin role.  Permissions scoped globally
RocketChat.authz.addUserRoles(userId, ['admin'])

# assign user to moderator role.  Permissions scoped to the specified room
# user can moderate (e.g. edit channel name, delete private group message) for only one room specified by the roomId
RocketChat.authz.addUserRoles(userId, ['moderator'], roomId )

# check if user can modify message for any room
RocketChat.authz.hasPermission(userId, 'edit-message')

# check if user can modify message for the specified room.  Also returns true if user
# has 'edit-message' at global scope.
RocketChat.authz.hasPermission(userId, 'edit-message', roomId)
```

Notes:
1. Roles are statically defined.  UI needs to be implemented to dynamically assign permission(s) to a Role
2. 'admin', 'moderator', 'user' role identifiers should NOT be changed (unless you update the associated code) because they are referenced when creating users and creating rooms.
3. edit, delete message permissions are at either the global or room scope.  i.e. role with edit-message with GLOBAL scope can edit ANY message regardless of the room type.  However, role with edit-message with room scope can only edit messages for the room.  The global scope is associated with the admin role while the "room-scoped" permission is assigned to the room "moderator" (room creator).  If we want a middle ground that allows for edit-message for only channel/group/direct, then we need to create individual edit-c-message, edit-p-message, edit-d-message permissions.
