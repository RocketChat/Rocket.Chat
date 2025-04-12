import { api } from '@rocket.chat/core-services';
import type { UserStatus } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, LivechatRooms, Users } from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';

import { updateDepartmentAgents } from './Helper';
import { afterAgentAdded, afterRemoveAgent } from './hooks';
import { callbacks } from '../../../../lib/callbacks';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { settings } from '../../../settings/server';

export async function notifyAgentStatusChanged(userId: string, status?: UserStatus) {
	if (!status) {
		return;
	}

	void callbacks.runAsync('livechat.agentStatusChanged', { userId, status });
	if (!settings.get('Livechat_show_agent_info')) {
		return;
	}

	await LivechatRooms.findOpenByAgent(userId).forEach((room) => {
		void api.broadcast('omnichannel.room', room._id, {
			type: 'agentStatus',
			status,
		});
	});
}

export async function addManager(username: string) {
	// TODO: remove 'check' function call
	check(username, String);

	const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

	if (!user) {
		throw new Meteor.Error('error-invalid-user');
	}

	if (await addUserRolesAsync(user._id, ['livechat-manager'])) {
		return user;
	}

	return false;
}

export async function addAgent(username: string) {
	check(username, String);

	const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

	if (!user) {
		throw new Meteor.Error('error-invalid-user');
	}

	if (await addUserRolesAsync(user._id, ['livechat-agent'])) {
		return afterAgentAdded(user);
	}

	return false;
}

export async function removeAgent(username: string) {
	// TODO: we already validated user exists at this point, remove this check
	const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

	if (!user) {
		throw new Error('error-invalid-user');
	}

	const { _id } = user;

	if (await removeUserFromRolesAsync(_id, ['livechat-agent'])) {
		return afterRemoveAgent(user);
	}

	return false;
}

export async function removeManager(username: string) {
	// TODO: we already validated user exists at this point, remove this check
	const user = await Users.findOneByUsername(username, { projection: { _id: 1 } });

	if (!user) {
		throw new Error('error-invalid-user');
	}

	return removeUserFromRolesAsync(user._id, ['livechat-manager']);
}

export async function saveAgentInfo(_id: string, agentData: any, agentDepartments: string[]) {
	// TODO: check if these 'check' functions are necessary
	check(_id, String);
	check(agentData, Object);
	check(agentDepartments, [String]);

	const user = await Users.findOneById(_id);
	if (!user || !(await hasRoleAsync(_id, 'livechat-agent'))) {
		throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent');
	}

	await Users.setLivechatData(_id, removeEmpty(agentData));

	const currentDepartmentsForAgent = await LivechatDepartmentAgents.findByAgentId(_id).toArray();

	const toRemoveIds = currentDepartmentsForAgent
		.filter((dept) => !agentDepartments.includes(dept.departmentId))
		.map((dept) => dept.departmentId);
	const toAddIds = agentDepartments.filter((d) => !currentDepartmentsForAgent.some((c) => c.departmentId === d));

	await Promise.all(
		await LivechatDepartment.findInIds([...toRemoveIds, ...toAddIds], {
			projection: {
				_id: 1,
				enabled: 1,
			},
		})
			.map((dep) => {
				return updateDepartmentAgents(
					dep._id,
					{
						...(toRemoveIds.includes(dep._id) ? { remove: [{ agentId: _id }] } : { upsert: [{ agentId: _id, count: 0, order: 0 }] }),
					},
					dep.enabled,
				);
			})
			.toArray(),
	);

	return true;
}
