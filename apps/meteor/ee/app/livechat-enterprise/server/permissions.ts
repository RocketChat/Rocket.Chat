import { Permissions, Roles } from '@rocket.chat/models';

import { createOrUpdateProtectedRoleAsync } from '../../../../server/lib/roles/createOrUpdateProtectedRole';

export const createPermissions = async (): Promise<void> => {
	const livechatMonitorRole = 'livechat-monitor';
	const livechatManagerRole = 'livechat-manager';
	const adminRole = 'admin';

	const monitorRole = await Roles.findOneById(livechatMonitorRole, { projection: { _id: 1 } });
	if (!monitorRole) {
		await createOrUpdateProtectedRoleAsync(livechatMonitorRole, {
			name: livechatMonitorRole,
		});
	}

	await Promise.all([
		Permissions.create('manage-livechat-units', [adminRole, livechatManagerRole]),
		Permissions.create('manage-livechat-monitors', [adminRole, livechatManagerRole]),
		Permissions.create('manage-livechat-tags', [adminRole, livechatManagerRole]),
		Permissions.create('manage-livechat-priorities', [adminRole, livechatManagerRole]),
		Permissions.create('manage-livechat-canned-responses', [adminRole, livechatManagerRole, livechatMonitorRole]),
		Permissions.create('spy-voip-calls', [adminRole, livechatManagerRole, livechatMonitorRole]),
		Permissions.create('outbound-voip-calls', [adminRole, livechatManagerRole]),
	]);
};
