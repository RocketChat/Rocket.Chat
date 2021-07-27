import { Permissions, Roles } from '../../../../app/models/server';

export const createPermissions = () => {
	if (!Permissions) {
		return;
	}

	const livechatMonitorRole = 'livechat-monitor';
	const livechatManagerRole = 'livechat-manager';
	const adminRole = 'admin';

	const monitorRole = Roles.findOneById(livechatMonitorRole, { fields: { _id: 1 } });
	if (!monitorRole) {
		Roles.createOrUpdate(livechatMonitorRole);
	}

	Permissions.create('manage-livechat-units', [adminRole, livechatManagerRole]);
	Permissions.create('manage-livechat-monitors', [adminRole, livechatManagerRole]);
	Permissions.create('manage-livechat-tags', [adminRole, livechatManagerRole]);
	Permissions.create('manage-livechat-priorities', [adminRole, livechatManagerRole]);
	Permissions.create('manage-livechat-canned-responses', [adminRole, livechatManagerRole]);
};
