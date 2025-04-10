import { api } from '@rocket.chat/core-services';
import type { UserStatus } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
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
