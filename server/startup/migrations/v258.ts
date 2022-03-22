import { Roles, Users, Subscriptions } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';
import type { IRole, IUser } from '../../../definition/IUser';
import type { ISubscription } from '../../../definition/ISubscription';

addMigration({
	version: 258,
	async up() {
		// Load all role ids and names
		const roles = await Roles.find<Pick<IRole, '_id' | 'name'>>({}, { projection: { _id: 1, name: 1 } }).toArray();

		// Skip any role where the ID and name are the same
		const filteredRoles = roles.filter(({ _id, name }) => _id !== name);

		const roleNames = filteredRoles.map(({ name }) => name);
		const roleMap = filteredRoles.reduce(
			(prev: Record<IRole['name'], IRole['_id']>, { _id, name }) => ({
				...prev,
				[name]: _id,
			}),
			{},
		);

		// Find all users that have a role name in their roles attribute
		const users = await Users.find<Pick<IUser, '_id' | 'roles'>>(
			{ roles: { $in: roleNames } },
			{ projection: { _id: 1, roles: 1 } },
		).toArray();

		// Replace any known role names with the id
		await Promise.allSettled(
			users.map(({ _id, roles }) => {
				const newRoles = roles.map((name) => roleMap[name] || name);
				return Users.update({ _id }, { $set: { roles: newRoles } });
			}),
		);

		// Find all subscriptions that have a role name in their roles attribute
		const subscriptions = await Subscriptions.find<Required<Pick<ISubscription, '_id' | 'roles'>>>(
			{ roles: { $in: roleNames } },
			{ projection: { _id: 1, roles: 1 } },
		).toArray();

		// Replace any known role names with the id
		await Promise.allSettled(
			subscriptions.map(({ _id, roles }) => {
				const newRoles = roles.map((name) => roleMap[name] || name);
				return Subscriptions.update({ _id }, { $set: { roles: newRoles } });
			}),
		);
	},
});
