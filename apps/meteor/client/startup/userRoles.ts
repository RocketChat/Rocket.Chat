import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { UserRoles, ChatMessage } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { dispatchToastMessage } from '../lib/toast';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			sdk
				.call('getUserRoles')
				.then((results) => {
					for (const record of results) {
						UserRoles.upsert({ _id: record._id }, record);
					}
				})
				.catch((error) => {
					dispatchToastMessage({ type: 'error', message: error });
				});

			Notifications.onLogged('roles-change', (role) => {
				if (role.type === 'added') {
					if (!role.scope) {
						if (!role.u) {
							return;
						}
						UserRoles.upsert({ _id: role.u._id }, { $addToSet: { roles: role._id }, $set: { username: role.u.username } });
						ChatMessage.update({ 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
					}

					return;
				}

				if (role.type === 'removed') {
					if (!role.scope) {
						if (!role.u) {
							return;
						}
						UserRoles.update({ _id: role.u._id }, { $pull: { roles: role._id } });
						ChatMessage.update({ 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
					}

					return;
				}

				if (role.type === 'changed') {
					ChatMessage.update({ roles: role._id }, { $inc: { rerender: 1 } }, { multi: true });
				}
			});
		}
	});
});
