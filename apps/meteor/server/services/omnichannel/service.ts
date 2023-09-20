import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IOmnichannelService } from '@rocket.chat/core-services';
import type { AtLeast, IOmnichannelQueue, IOmnichannelRoom } from '@rocket.chat/core-typings';

import { Livechat } from '../../../app/livechat/server/lib/LivechatTyped';
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

		// TODO: Waiting for license definitions
		/* this.onEvent('mac.limitreached', async (): Promise<void> => {
			// void Livechat.notifyMacLimitReached();
			await this.queueWorker.stop();
		});

		this.onEvent('license.validated', async (): Promise<void> => {
			// void Livechat.notifyLicenseChanged();
			await this.queueWorker.shouldStart();
		}); */
	}

	async started() {
		settings.watch<boolean>('Livechat_enabled', (enabled) => {
			void (enabled && RoutingManager.isMethodSet() ? this.queueWorker.shouldStart() : this.queueWorker.stop());
		});
	}

	getQueueWorker(): IOmnichannelQueue {
		return this.queueWorker;
	}

	async isRoomEnabled(_room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean> {
		// const currentMonth = moment.utc().format('YYYY-MM');
		// return license.isMacOnLimit() || room.v.activity.includes(currentMonth)
		return true;
	}

	async checkMACLimit(): Promise<boolean> {
		// return license.isMacOnLimit();
		return true;
	}
}
