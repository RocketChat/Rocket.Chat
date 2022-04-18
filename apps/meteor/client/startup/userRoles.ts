import type { IRocketChatRecord, IRole, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { UserRoles, RoomRoles, ChatMessage } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import { handleError } from '../lib/utils/handleError';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			Meteor.call('getUserRoles', (error: Error, results: IRocketChatRecord[]) => {
				if (error) {
					return handleError(error);
				}

				for (const record of results) {
					UserRoles.upsert({ _id: record._id }, record);
				}
			});

			Notifications.onLogged(
				'roles-change',
				(role: { type: 'added' | 'removed' | 'changed'; _id: IRole['_id']; u: Partial<IUser>; scope: IRole['scope'] }) => {
					if (role.type === 'added') {
						if (role.scope) {
							RoomRoles.upsert({ 'rid': role.scope, 'u._id': role.u._id }, { $setOnInsert: { u: role.u }, $addToSet: { roles: role._id } });
						} else {
							UserRoles.upsert({ _id: role.u._id }, { $addToSet: { roles: role._id }, $set: { username: role.u.username } });
							ChatMessage.update({ 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
						}

						return;
					}

					if (role.type === 'removed') {
						if (role.scope) {
							RoomRoles.update({ 'rid': role.scope, 'u._id': role.u._id }, { $pull: { roles: role._id } });
						} else {
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
