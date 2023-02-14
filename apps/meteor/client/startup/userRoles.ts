import type { IRocketChatRecord, IRole, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { UserRoles, ChatMessage } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import { dispatchToastMessage } from '../lib/toast';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			Meteor.call('getUserRoles', (error: Error, results: IRocketChatRecord[]) => {
				if (error) {
					dispatchToastMessage({ type: 'error', message: error });
					return;
				}

				for (const record of results) {
					UserRoles.upsert({ _id: record._id }, record);
				}
			});

			Notifications.onLogged(
				'roles-change',
				(role: { type: 'added' | 'removed' | 'changed'; _id: IRole['_id']; u: Partial<IUser>; scope: IRole['scope'] }) => {
					if (role.type === 'added') {
						if (!role.scope) {
							UserRoles.upsert({ _id: role.u._id }, { $addToSet: { roles: role._id }, $set: { username: role.u.username } });
							ChatMessage.update({ 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
						}

						return;
					}

					if (role.type === 'removed') {
						if (!role.scope) {
							UserRoles.update({ _id: role.u._id }, { $pull: { roles: role._id } });
							ChatMessage.update({ 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
						}

						return;
					}

					if (role.type === 'changed') {
						ChatMessage.update({ roles: role._id }, { $inc: { rerender: 1 } }, { multi: true });
					}
				},
			);
		}
	});
});
