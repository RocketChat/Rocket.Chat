import { VideoConf } from '@rocket.chat/core-services';
import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import type { ILivechatAgent, ILivechatVisitor, IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';
import type { Filter } from 'mongodb';

import { RoutingManager } from './RoutingManager';
import type { AKeyOf } from './localTypes';
import { callbacks } from '../../../../lib/callbacks';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import { notifyOnUserChange } from '../../../lib/server/lib/notifyListener';
import { businessHourManager } from '../business-hour';

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

export async function allowAgentChangeServiceStatus(statusLivechat: ILivechatAgentStatus, agentId: string) {
	if (statusLivechat !== ILivechatAgentStatus.AVAILABLE) {
		return true;
	}

	return businessHourManager.allowAgentChangeServiceStatus(agentId);
}

export async function updateCallStatus(callId: string, rid: string, status: 'ended' | 'declined', user: IUser | ILivechatVisitor) {
	await Rooms.setCallStatus(rid, status);
	if (status === 'ended' || status === 'declined') {
		if (await VideoConf.declineLivechatCall(callId)) {
			return;
		}

		return updateMessage({ _id: callId, msg: status, actionLinks: [], webRtcCallEndTs: new Date(), rid }, user as unknown as IUser);
	}
}
