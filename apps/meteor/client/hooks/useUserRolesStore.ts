import type { IRocketChatRecord, IRole, IUser } from '@rocket.chat/core-typings';
import { create } from 'zustand';

export const useUserRolesStore = create<{
	rolesByUser: Map<IUser['_id'], IRole['_id'][]>;
	sync(results: (IRocketChatRecord & Pick<IUser, '_id' | 'username' | 'roles'>)[]): void;
	addRole(userId: IUser['_id'], roleId: IRole['_id']): void;
	removeRole(userId: IUser['_id'], roleId: IRole['_id']): void;
}>()((set) => ({
	rolesByUser: new Map(),
	sync(results) {
		set(({ rolesByUser }) => {
			rolesByUser = new Map(rolesByUser);
			for (const record of results) {
				rolesByUser.set(record._id, record.roles);
			}

			return { rolesByUser };
		});
	},
	addRole(userId, roleId) {
		set(({ rolesByUser }) => {
			rolesByUser = new Map(rolesByUser);
			const roles = new Set(rolesByUser.get(userId));
			roles.add(roleId);
			rolesByUser.set(userId, Array.from(roles));

			return { rolesByUser };
		});
	},
	removeRole(userId, roleId) {
		set(({ rolesByUser }) => {
			rolesByUser = new Map(rolesByUser);
			const roles = new Set(rolesByUser.get(userId));
			roles.delete(roleId);
			rolesByUser.set(userId, Array.from(roles));

			return { rolesByUser };
		});
	},
}));
