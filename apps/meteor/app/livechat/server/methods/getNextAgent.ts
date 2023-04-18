import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { LivechatRooms, Users } from '@rocket.chat/models';
import type { ILivechatAgent } from '@rocket.chat/core-typings';

import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getNextAgent'(params: {
			token: string;
			department?: string;
		}): Promise<Pick<ILivechatAgent, '_id' | 'name' | 'customFields' | 'username' | 'status' | 'phone' | 'livechat'> | undefined | null>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getNextAgent'({ token, department }) {
		methodDeprecationLogger.warn('livechat:getNextAgent will be deprecated in future versions of Rocket.Chat');
		check(token, String);

		const room = await LivechatRooms.findOpenByVisitorToken(token).toArray();

		if (room && room.length > 0) {
			return;
		}

		if (!department) {
			const requireDeparment = await Livechat.getRequiredDepartment();
			if (requireDeparment) {
				department = requireDeparment._id;
			}
		}

		const agent = await Livechat.getNextAgent(department);
		if (!agent) {
			return;
		}

		return Users.getAgentInfo(agent.agentId);
	},
});
