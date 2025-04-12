import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import type { AtLeast, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { setUserStatusLivechat } from './utils';
import { callbacks } from '../../../../lib/callbacks';

export async function afterAgentUserActivated(user: IUser) {
	if (!user.roles.includes('livechat-agent')) {
		throw new Error('invalid-user-role');
	}
	// TODO: deprecate this `operator` property
	await Users.setOperator(user._id, true);
	callbacks.runAsync('livechat.onNewAgentCreated', user._id);
}

export async function afterAgentAdded(user: IUser) {
	await Promise.all([
		Users.setOperator(user._id, true),
		setUserStatusLivechat(user._id, user.status !== 'offline' ? ILivechatAgentStatus.AVAILABLE : ILivechatAgentStatus.NOT_AVAILABLE),
	]);
	callbacks.runAsync('livechat.onNewAgentCreated', user._id);

	return user;
}

export async function afterRemoveAgent(user: AtLeast<IUser, '_id' | 'username'>) {
	await callbacks.run('livechat.afterAgentRemoved', { agent: user });
	return true;
}
