import { Permissions, Roles } from '@rocket.chat/models';

import { createOrUpdateProtectedRoleAsync } from '../../../../server/lib/roles/createOrUpdateProtectedRole';

const livechatMonitorRole = 'livechat-monitor';
const livechatManagerRole = 'livechat-manager';
const adminRole = 'admin';
const livechatAgentRole = 'livechat-agent';

export const omnichannelEEPermissions = [
	{ _id: 'manage-livechat-units', roles: [adminRole, livechatManagerRole] },
	{ _id: 'manage-livechat-monitors', roles: [adminRole, livechatManagerRole] },
	{ _id: 'manage-livechat-tags', roles: [adminRole, livechatManagerRole] },
	{ _id: 'manage-livechat-priorities', roles: [adminRole, livechatManagerRole] },
	{ _id: 'manage-livechat-sla', roles: [adminRole, livechatManagerRole] },
	{ _id: 'manage-livechat-canned-responses', roles: [adminRole, livechatManagerRole, livechatMonitorRole] },
	{ _id: 'spy-voip-calls', roles: [adminRole, livechatManagerRole, livechatMonitorRole] },
	{ _id: 'outbound-voip-calls', roles: [adminRole, livechatManagerRole] },
	{ _id: 'request-pdf-transcript', roles: [adminRole, livechatManagerRole, livechatMonitorRole, livechatAgentRole] },
	{ _id: 'view-livechat-reports', roles: [adminRole, livechatManagerRole, livechatMonitorRole] },
];

export const createPermissions = async (): Promise<void> => {
	const monitorRole = await Roles.findOneById(livechatMonitorRole, { projection: { _id: 1 } });
	if (!monitorRole) {
		await createOrUpdateProtectedRoleAsync(livechatMonitorRole, {
			name: livechatMonitorRole,
		});
	}

	await Promise.all(omnichannelEEPermissions.map(async (permission) => Permissions.create(permission._id, permission.roles)));
};
