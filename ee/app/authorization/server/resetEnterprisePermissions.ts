import { Permissions } from '../../../../app/models/server/raw';
import { guestPermissions } from '../lib/guestPermissions';

export const resetEnterprisePermissions = async function (): Promise<void> {
	await Permissions.update({ _id: { $nin: guestPermissions } }, { $pull: { roles: 'guest' } }, { multi: true });
};
