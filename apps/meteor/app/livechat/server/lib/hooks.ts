import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

export async function afterAgentUserActivated(user: IUser) {
	if (!user.roles.includes('livechat-agent')) {
		throw new Error('invalid-user-role');
	}
	// TODO: deprecate this `operator` property
	await Users.setOperator(user._id, true);
	callbacks.runAsync('livechat.onNewAgentCreated', user._id);
}
