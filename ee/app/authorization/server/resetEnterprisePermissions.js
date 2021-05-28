import { Permissions } from '../../../../server/models';
import { guestPermissions } from '../lib/guestPermissions';

export const resetEnterprisePermissions = function() {
	Permissions.update({ _id: { $nin: guestPermissions } }, { $pull: { roles: 'guest' } }, { multi: true });
};
