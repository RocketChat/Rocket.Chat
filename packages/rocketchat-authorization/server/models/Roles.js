import { RocketChat } from 'meteor/rocketchat:lib';

class ModelRoles extends RocketChat.models._Base {
	constructor(...args) {
		super(...args);
		this.tryEnsureIndex({ name: 1 });
		this.tryEnsureIndex({ scope: 1 });
	}

	findUsersInRole(name, scope, options) {
		const role = this.findOne(name);
		const roleScope = (role && role.scope) || 'Users';
		const model = RocketChat.models[roleScope];

		return model && model.findUsersInRoles && model.findUsersInRoles(name, scope, options);
	}

	isUserInRoles(userId, roles, scope) {
		roles = [].concat(roles);
		return roles.some((roleName) => {
			const role = this.findOne(roleName);
			const roleScope = (role && role.scope) || 'Users';
			const model = RocketChat.models[roleScope];

			return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
		});
	}

	createOrUpdate(name, scope = 'Users', description, protectedRole, mandatory2fa) {
		const updateData = {};
		updateData.name = name;
		updateData.scope = scope;

		if (description != null) {
			updateData.description = description;
		}

		if (protectedRole) {
			updateData.protected = protectedRole;
		}

		if (mandatory2fa != null) {
			updateData.mandatory2fa = mandatory2fa;
		}

		this.upsert({ _id: name }, { $set: updateData });
	}

	addUserRoles(userId, roles, scope) {
		roles = [].concat(roles);
		for (const roleName of roles) {
			const role = this.findOne(roleName);
			const roleScope = (role && role.scope) || 'Users';
			const model = RocketChat.models[roleScope];

			model && model.addRolesByUserId && model.addRolesByUserId(userId, roleName, scope);
		}
		return true;
	}

	removeUserRoles(userId, roles, scope) {
		roles = [].concat(roles);
		for (const roleName of roles) {
			const role = this.findOne(roleName);
			const roleScope = (role && role.scope) || 'Users';
			const model = RocketChat.models[roleScope];

			model && model.removeRolesByUserId && model.removeRolesByUserId(userId, roleName, scope);
		}
		return true;
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [{
				_id: _idOrName,
			}, {
				name: _idOrName,
			}],
		};

		return this.findOne(query, options);
	}
}

RocketChat.models.Roles = new ModelRoles('roles');
