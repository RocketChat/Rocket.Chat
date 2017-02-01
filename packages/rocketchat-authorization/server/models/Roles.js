var ModelRoles,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ModelRoles = (function(superClass) {
  extend(ModelRoles, superClass);

  function ModelRoles() {
    ModelRoles.__super__.constructor.apply(this, arguments);
    this.tryEnsureIndex({
      'name': 1
    });
    this.tryEnsureIndex({
      'scope': 1
    });
  }

  ModelRoles.prototype.findUsersInRole = function(name, scope, options) {
    var ref, role, roleScope;
    role = this.findOne(name);
    roleScope = (role != null ? role.scope : void 0) || 'Users';
    return (ref = RocketChat.models[roleScope]) != null ? typeof ref.findUsersInRoles === "function" ? ref.findUsersInRoles(name, scope, options) : void 0 : void 0;
  };

  ModelRoles.prototype.isUserInRoles = function(userId, roles, scope) {
    roles = [].concat(roles);
    return _.some(roles, (function(_this) {
      return function(roleName) {
        var ref, role, roleScope;
        role = _this.findOne(roleName);
        roleScope = (role != null ? role.scope : void 0) || 'Users';
        return (ref = RocketChat.models[roleScope]) != null ? typeof ref.isUserInRole === "function" ? ref.isUserInRole(userId, roleName, scope) : void 0 : void 0;
      };
    })(this));
  };

  ModelRoles.prototype.createOrUpdate = function(name, scope, description, protectedRole) {
    var updateData;
    if (scope == null) {
      scope = 'Users';
    }
    updateData = {};
    updateData.name = name;
    updateData.scope = scope;
    if (description != null) {
      updateData.description = description;
    }
    if (protectedRole != null) {
      updateData["protected"] = protectedRole;
    }
    return this.upsert({
      _id: name
    }, {
      $set: updateData
    });
  };

  ModelRoles.prototype.addUserRoles = function(userId, roles, scope) {
    var i, len, ref, results, role, roleName, roleScope;
    roles = [].concat(roles);
    results = [];
    for (i = 0, len = roles.length; i < len; i++) {
      roleName = roles[i];
      role = this.findOne(roleName);
      roleScope = (role != null ? role.scope : void 0) || 'Users';
      results.push((ref = RocketChat.models[roleScope]) != null ? typeof ref.addRolesByUserId === "function" ? ref.addRolesByUserId(userId, roleName, scope) : void 0 : void 0);
    }
    return results;
  };

  ModelRoles.prototype.removeUserRoles = function(userId, roles, scope) {
    var i, len, ref, results, role, roleName, roleScope;
    roles = [].concat(roles);
    results = [];
    for (i = 0, len = roles.length; i < len; i++) {
      roleName = roles[i];
      role = this.findOne(roleName);
      roleScope = (role != null ? role.scope : void 0) || 'Users';
      results.push((ref = RocketChat.models[roleScope]) != null ? typeof ref.removeRolesByUserId === "function" ? ref.removeRolesByUserId(userId, roleName, scope) : void 0 : void 0);
    }
    return results;
  };

  return ModelRoles;

})(RocketChat.models._Base);

RocketChat.models.Roles = new ModelRoles('roles', true);

RocketChat.models.Roles.cache.load();
