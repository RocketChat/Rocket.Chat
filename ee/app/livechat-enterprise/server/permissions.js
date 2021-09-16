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
	Permissions.create('manage-livechat-canned-responses', [adminRole, livechatManagerRole, livechatMonitorRole]);

	// VOIP permissions
	// allows to hook on an ongoing call and listen
	Permissions.create('spy-voip-calls', [adminRole, livechatManagerRole, livechatMonitorRole]);
	// allows to perform an outgoing voip call
	Permissions.create('outbound-voip-calls', [adminRole, livechatManagerRole]);
};
