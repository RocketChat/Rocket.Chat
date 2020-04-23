import { Tracker } from 'meteor/tracker';

import { AuthorizationUtils } from '../../../../app/authorization/lib/AuthorizationUtils';
import { AuthzCachedCollection, ChatPermissions } from '../../../../app/models/client';
import { guestPermissions } from '../lib/guestPermissions';

const _addRoleRestrictions = function() {
	// Add everything except the guestPermissions to the restricted list of the guest role
	const permissions = ChatPermissions.find({}, { fields: { _id: true } });
	const restrictedPermissions = [];

	permissions.forEach(({ _id }) => {
		if (guestPermissions.includes(_id)) {
			return true;
		}

		AuthorizationUtils.addRestrictedRolePermission('guest', _id);
		restrictedPermissions.push(_id);
	});

	if (restrictedPermissions.length) {
		// On the client we update the collection to ensure it updates the screen if it was opened before we were ready
		ChatPermissions.update({ _id: { $in: restrictedPermissions } }, { $set: { _updatedAt: new Date() } }, { multi: true });
	}
};

export const addRoleRestrictions = function() {
	return Tracker.autorun(() => {
		if (AuthzCachedCollection.ready.get()) {
			_addRoleRestrictions();
		}
	});
};
