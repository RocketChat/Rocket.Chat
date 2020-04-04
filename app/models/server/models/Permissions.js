import { Base } from './_Base';

export class Permissions extends Base {
	// FIND
	findByRole(role, options) {
		const query = {
			roles: role,
		};

		return this.find(query, options);
	}

	findOneById(_id) {
		return this.findOne({ _id });
	}

	createOrUpdate(name, roles) {
		const exists = this.findOne({
			_id: name,
			roles,
		}, { fields: { _id: 1 } });

		if (exists) {
			return exists._id;
		}

		this.upsert({ _id: name }, { $set: { roles } });
	}

	create(name, roles) {
		const exists = this.findOneById(name, { fields: { _id: 1 } });

		if (exists) {
			return exists._id;
		}

		this.upsert({ _id: name }, { $set: { roles } });
	}

	addRole(permission, role) {
		this.update({ _id: permission, roles: { $ne: role } }, { $addToSet: { roles: role } });
	}

	removeRole(permission, role) {
		this.update({ _id: permission, roles: role }, { $pull: { roles: role } });
	}
}

export default new Permissions('permissions');
