import type { ILivechatAgent, ILivechatAgentStatus, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { Filter } from 'mongodb';

import { RoutingManager } from './RoutingManager';
import type { AKeyOf } from './localTypes';
import { callbacks } from '../../../../lib/callbacks';
import { notifyOnUserChange } from '../../../lib/server/lib/notifyListener';

export function showConnecting() {
	return RoutingManager.getConfig()?.showConnecting || false;
}

export async function setUserStatusLivechat(userId: string, status: ILivechatAgentStatus) {
	const user = await Users.setLivechatStatus(userId, status);
	// TODO: shouldnt this callback run if the modified count is > 0 too?
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

export async function setUserStatusLivechatIf(
	userId: string,
	status: ILivechatAgentStatus,
	condition?: Filter<IUser>,
	fields?: AKeyOf<ILivechatAgent>,
) {
	const result = await Users.setLivechatStatusIf(userId, status, condition, fields);

	if (result.modifiedCount > 0) {
		void notifyOnUserChange({
			id: userId,
			clientAction: 'updated',
			diff: { ...fields, statusLivechat: status },
		});
	}

	// TODO: shouldnt this callback run if the modified count is > 0 too?
	callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });
	return result;
}
