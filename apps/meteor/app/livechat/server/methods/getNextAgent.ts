import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { settings } from '../../../settings/server';
import { Livechat } from '../lib/LivechatTyped';

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
		methodDeprecationLogger.method('livechat:getNextAgent', '7.0.0');
		check(token, String);

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		const room = await LivechatRooms.findOpenByVisitorToken(token, {}, extraQuery).toArray();

		if (room && room.length > 0) {
			return;
		}

		if (!department) {
			const requireDepartment = await Livechat.getRequiredDepartment();
			if (requireDepartment) {
				department = requireDepartment._id;
			}
		}

		const agent = await Livechat.getNextAgent(department);
		if (!agent) {
			return;
		}

		return Users.getAgentInfo(agent.agentId, settings.get('Livechat_show_agent_email'));
	},
});
