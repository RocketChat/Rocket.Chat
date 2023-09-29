import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IOmnichannelService } from '@rocket.chat/core-services';
import type { AtLeast, IOmnichannelQueue, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import moment from 'moment';

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

		License.onLimitReached('monthlyActiveContacts', async (): Promise<void> => {
			void this.api?.broadcast('mac.LimitReached', {});
			await this.queueWorker.stop();
		});

		License.onValidateLicense(async (): Promise<void> => {
			void this.api?.broadcast('mac.limitRestored', {});
			await this.queueWorker.shouldStart();
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

	async isRoomEnabled(room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean> {
		const currentMonth = moment.utc().format('YYYY-MM');
		// @ts-expect-error - v.activity
		return room.v?.activity?.includes(currentMonth) || !(await License.shouldPreventAction('monthlyActiveContacts'));
	}

	async checkMACLimit(): Promise<boolean> {
		// return license.isMacOnLimit();
		return !(await License.shouldPreventAction('monthlyActiveContacts'));
	}
}
