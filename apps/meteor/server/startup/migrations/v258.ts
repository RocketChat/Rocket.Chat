import type { IRole } from '@rocket.chat/core-typings';
import { Roles, Users, Subscriptions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 258,
	async up() {
		// Load all role ids and names
		const roles = await Roles.find<Pick<IRole, '_id' | 'name' | 'scope'>>({}, { projection: { _id: 1, name: 1, scope: 1 } }).toArray();
		// Skip any role where the ID and name are the same
		const filteredRoles = roles.filter(({ _id, name }) => _id !== name);

		// First, add the role id to all documents that have the name
		await Promise.allSettled(
			filteredRoles.map(({ _id, name, scope }) => {
				const query = {
					roles: name,
				};

				const update = {
					$push: {
						roles: _id,
					},
				};

				if (scope === 'Subscriptions') {
					return Subscriptions.updateMany(query, update);
				}

				return Users.updateMany(query, update);
			}),
		);

		// Remove the role name from all documents
		await Promise.allSettled(
			filteredRoles.map(({ name, scope }) => {
				const query = {
					roles: name,
				};

				const update = {
					$pull: {
						roles: name,
					},
				};

				if (scope === 'Subscriptions') {
					return Subscriptions.updateMany(query, update);
				}

				return Users.updateMany(query, update);
			}),
		);
	},
});
