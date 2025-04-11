import { api } from '@rocket.chat/core-services';
import type { UserStatus } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';

import { afterAgentAdded, afterRemoveAgent } from './hooks';
import { callbacks } from '../../../../lib/callbacks';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
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
