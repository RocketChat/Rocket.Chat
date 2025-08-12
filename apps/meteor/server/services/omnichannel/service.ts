import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IOmnichannelService } from '@rocket.chat/core-services';
import type { AtLeast, IOmnichannelQueue, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import moment from 'moment';

import { OmnichannelQueue } from './queue';
import { RoutingManager } from '../../../app/livechat/server/lib/RoutingManager';
import { notifyAgentStatusChanged } from '../../../app/livechat/server/lib/omni-users';
import { settings } from '../../../app/settings/server';

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
				await notifyAgentStatusChanged(user._id, user.status);
			}
		});
	}

	async started() {
		settings.watchMultiple(['Livechat_enabled', 'Livechat_Routing_Method'], () => {
			this.queueWorker.shouldStart();
		});

		License.onLimitReached('monthlyActiveContacts', async (): Promise<void> => {
			this.queueWorker.isRunning() && (await this.queueWorker.stop());
		});

		License.onValidateLicense(async (): Promise<void> => {
			RoutingManager.isMethodSet() && (await this.queueWorker.shouldStart());
		});

		// NOTE: When there's no license or license is invalid, we fallback to CE behavior
		// CE behavior means there's no MAC limit, so we start the queue
		License.onInvalidateLicense(async (): Promise<void> => {
			this.queueWorker.isRunning() && (await this.queueWorker.shouldStart());
		});
	}

	async isWithinMACLimit(room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean> {
		const currentMonth = moment.utc().format('YYYY-MM');
		return room.v?.activity?.includes(currentMonth) || !(await License.shouldPreventAction('monthlyActiveContacts'));
	}
}
