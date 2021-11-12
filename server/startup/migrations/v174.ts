import { Permissions } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

const appRolePermissions = [
	'api-bypass-rate-limit',
	'create-c',
	'create-d',
	'create-p',
	'join-without-join-code',
	'leave-c',
	'leave-p',
	'send-many-messages',
	'view-c-room',
	'view-d-room',
	'view-joined-room',
];

addMigration({
	version: 174,
	up() {
		return Permissions.update({ _id: { $in: appRolePermissions } }, { $addToSet: { roles: 'app' } }, { multi: true });
	},
	down() {
		return Permissions.update({ _id: { $in: appRolePermissions } }, { $pull: { roles: 'app' } }, { multi: true });
	},
});
