import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Messages } from '../../app/models/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { useUserRolesStore } from '../hooks/useUserRolesStore';
import { dispatchToastMessage } from '../lib/toast';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			sdk
				.call('getUserRoles')
				.then((results) => {
					useUserRolesStore.getState().sync(results);
				})
				.catch((error) => {
					dispatchToastMessage({ type: 'error', message: error });
				});

			sdk.stream('notify-logged', ['roles-change'], (role) => {
				if (role.type === 'added') {
					if (!role.scope) {
						if (!role.u) {
							return;
						}
						useUserRolesStore.getState().addRole(role.u._id, role._id);
						Messages.update({ 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
					}

					return;
				}

				if (role.type === 'removed') {
					if (!role.scope) {
						if (!role.u) {
							return;
						}
						useUserRolesStore.getState().removeRole(role.u._id, role._id);
						Messages.update({ 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
					}

					return;
				}

				if (role.type === 'changed') {
					Messages.update({ roles: role._id }, { $inc: { rerender: 1 } }, { multi: true });
				}
			});
		}
	});
});
