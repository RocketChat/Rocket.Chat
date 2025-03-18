import type { ISubscription, IUser, IRole, IRoom } from '@rocket.chat/core-typings';
import { create } from 'zustand';

import { Messages } from '../../app/models/client/models/Messages';

type RoomRoleRecord = {
	rid: IRoom['_id'];
	u: Pick<IUser, '_id' | 'name' | 'username'>;
	roles: IRole['_id'][];
};

export const useRoomRolesStore = create<{
	records: RoomRoleRecord[];
	added(role: Pick<ISubscription, 'rid' | 'u' | 'roles'>): void;
	changed(role: Pick<ISubscription, 'rid' | 'u' | 'roles'>): void;
	removed(role: Pick<ISubscription, 'rid' | 'u' | 'roles'>): void;
	sync(results: ISubscription[]): void;
	addRole(selector: { rid: IRoom['_id']; uid: IUser['_id'] }, role: IRole['_id']): void;
	removeRole(selector: { rid: IRoom['_id']; uid: IUser['_id'] }, role: IRole['_id']): void;
	updateUser(selector: { rid: IRoom['_id']; uid: IUser['_id'] }, u: Pick<IUser, 'username' | 'name'>): void;
}>()((set, get) => ({
	records: [],
	sync: (results) => {
		for (const result of results) {
			const existing = get().records.find((record) => record.rid === result.rid && record.u._id === result.u._id);
			if (existing) {
				get().changed(result);
			} else {
				get().added(result);
			}
		}
	},
	addRole: (selector, role) => {
		const existing = get().records.find((record) => record.rid === selector.rid && record.u._id === selector.uid);
		if (existing) {
			get().changed({
				...existing,
				roles: [...existing.roles, role],
			});
		} else {
			get().added({
				rid: selector.rid,
				u: { _id: selector.uid },
				roles: [role],
			});
		}
	},
	removeRole: (selector, role) => {
		const existing = get().records.find((record) => record.rid === selector.rid && record.u._id === selector.uid);
		if (existing) {
			get().changed({
				...existing,
				roles: existing.roles.filter((r) => r !== role),
			});
		}
	},
	updateUser: (selector, u) => {
		const existing = get().records.find((record) => record.rid === selector.rid && record.u._id === selector.uid);
		if (existing) {
			get().changed({
				...existing,
				u: {
					...existing.u,
					...u,
				},
			});
		}
	},
	added: (role) => {
		set(({ records }) => ({
			records: [
				...records,
				{
					rid: role.rid,
					u: role.u,
					roles: role.roles ?? [],
				},
			],
		}));

		if (!role.u?._id) {
			return;
		}

		Messages.update({ 'rid': role.rid, 'u._id': role.u._id }, { $addToSet: { roles: role.roles } }, { multi: true });
	},
	changed: (role) => {
		set(({ records }) => ({
			records: records.map((record) => {
				if (record.rid !== role.rid || record.u._id !== role.u._id) {
					return record;
				}

				return {
					...record,
					roles: role.roles ?? [],
				};
			}),
		}));

		if (!role.u?._id) {
			return;
		}

		Messages.update({ 'rid': role.rid, 'u._id': role.u._id }, { $inc: { rerender: 1 } }, { multi: true });
	},
	removed: (role) => {
		set(({ records }) => ({
			records: records.filter((record) => record.rid !== role.rid || record.u._id !== role.u._id),
		}));

		if (!role.u?._id) {
			return;
		}
		Messages.update({ 'rid': role.rid, 'u._id': role.u._id }, { $pull: { roles: role.roles } }, { multi: true });
	},
}));
