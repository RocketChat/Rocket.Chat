import { Migrations } from '../../migrations';
import { Permissions } from '../../../app/models/server';

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

Migrations.add({
	version: 174,
	up() {
		Permissions.update({ _id: { $in: appRolePermissions } }, { $addToSet: { roles: 'app' } }, { multi: true });
	},
	down() {
		Permissions.update({ _id: { $in: appRolePermissions } }, { $pull: { roles: 'app' } }, { multi: true });
	},
});
