import type { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { RoutingManager } from './RoutingManager';
import { callbacks } from '../../../../lib/callbacks';
import { notifyOnUserChange } from '../../../lib/server/lib/notifyListener';

export function showConnecting() {
	return RoutingManager.getConfig()?.showConnecting || false;
}

export async function setUserStatusLivechat(userId: string, status: ILivechatAgentStatus) {
	const user = await Users.setLivechatStatus(userId, status);
	callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });

	if (user.modifiedCount > 0) {
		void notifyOnUserChange({
			id: userId,
			clientAction: 'updated',
			diff: {
				statusLivechat: status,
				livechatStatusSystemModified: false,
			},
		});
	}

	return user;
}
