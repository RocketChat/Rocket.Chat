import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatRooms, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getAgentData'(params: {
			roomId: string;
			token: string;
		}): Promise<Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'customFields' | 'phone' | 'livechat'> | null | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getAgentData'({ roomId, token }) {
		check(roomId, String);
		check(token, String);

		methodDeprecationLogger.warn(
			'The method "livechat:getAgentData" is deprecated and will be removed after version v7.0.0. Use "livechat/agent.info/:rid/:token" instead.',
		);

		const room = await LivechatRooms.findOneById(roomId);
		const visitor = await LivechatVisitors.getVisitorByToken(token);

		if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor?.token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		if (!room.servedBy) {
			return;
		}

		return Users.getAgentInfo(room.servedBy._id, settings.get('Livechat_show_agent_email'));
	},
});
