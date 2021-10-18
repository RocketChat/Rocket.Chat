import { Permissions } from '../../../../app/models/server';
import { guestPermissions } from '../lib/guestPermissions';

export const resetEnterprisePermissions = function() {
	Permissions.update({ _id: { $nin: guestPermissions } }, { $pull: { roles: 'guest' } }, { multi: true });
};
