import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IOmnichannelService } from '@rocket.chat/core-services';
import type { IOmnichannelQueue } from '@rocket.chat/core-typings';

import { Livechat } from '../../../app/livechat/server';
import { RoutingManager } from '../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../app/settings/server';
import { OmnichannelQueue } from './queue';

export class OmnichannelService extends ServiceClassInternal implements IOmnichannelService {
	protected name = 'omnichannel';

	private queueWorker: IOmnichannelQueue;

	constructor() {
		super();
		this.queueWorker = new OmnichannelQueue();
	}

	async created() {
		this.onEvent('presence.status', async ({ user }): Promise<void> => {
			if (!user?._id) {
				return;
			}
			const hasRole = user.roles.some((role) => ['livechat-manager', 'livechat-monitor', 'livechat-agent'].includes(role));
			if (hasRole) {
				// TODO change `Livechat.notifyAgentStatusChanged` to a service call
				await Livechat.notifyAgentStatusChanged(user._id, user.status);
			}
		});
	}

	async started() {
		settings.watch<boolean>('Livechat_enabled', (enabled) => {
			void (enabled && RoutingManager.isMethodSet() ? this.queueWorker.shouldStart() : this.queueWorker.stop());
		});
	}

	getQueueWorker(): IOmnichannelQueue {
		return this.queueWorker;
	}
}
