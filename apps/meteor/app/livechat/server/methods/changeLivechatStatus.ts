import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { setUserStatusLivechat, allowAgentChangeServiceStatus } from '../lib/utils';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:changeLivechatStatus'(params?: { status?: ILivechatAgentStatus; agentId?: string }): unknown;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:changeLivechatStatus'({ status, agentId = Meteor.userId() } = {}) {
		methodDeprecationLogger.method('livechat:changeLivechatStatus', '7.0.0');

		const uid = Meteor.userId();

		if (!uid || !agentId) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:changeLivechatStatus',
			});
		}

		const agent = await Users.findOneAgentById(agentId, {
			projection: {
				status: 1,
				statusLivechat: 1,
			},
		});

		if (!agent) {
			throw new Meteor.Error('error-not-allowed', 'Invalid Agent Id', {
				method: 'livechat:changeLivechatStatus',
			});
		}

		if (status && !['available', 'not-available'].includes(status)) {
			throw new Meteor.Error('error-not-allowed', 'Invalid Status', {
				method: 'livechat:changeLivechatStatus',
			});
		}

		const newStatus: ILivechatAgentStatus =
			status ||
			(agent.statusLivechat === ILivechatAgentStatus.AVAILABLE ? ILivechatAgentStatus.NOT_AVAILABLE : ILivechatAgentStatus.AVAILABLE);

		if (newStatus === agent.statusLivechat) {
			return;
		}

		if (agentId !== uid) {
			if (!(await hasPermissionAsync(uid, 'manage-livechat-agents'))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', {
					method: 'livechat:changeLivechatStatus',
				});
			}
			return setUserStatusLivechat(agentId, newStatus);
		}

		if (!(await allowAgentChangeServiceStatus(newStatus, agentId))) {
			throw new Meteor.Error('error-business-hours-are-closed', 'Not allowed', {
				method: 'livechat:changeLivechatStatus',
			});
		}

		return setUserStatusLivechat(agentId, newStatus);
	},
});
