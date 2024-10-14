import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IOmnichannelService } from '@rocket.chat/core-services';
import type { AtLeast, ILivechatContact, IOmnichannelQueue, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts } from '@rocket.chat/models';
import moment from 'moment';

import { isSingleContactEnabled } from '../../../app/livechat/server/lib/Contacts';
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
	}

	async started() {
		settings.watch<boolean>('Livechat_enabled', (enabled) => {
			void (enabled && RoutingManager.isMethodSet() ? this.queueWorker.shouldStart() : this.queueWorker.stop());
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

	getQueueWorker(): IOmnichannelQueue {
		return this.queueWorker;
	}

	async isWithinMACLimit(room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean> {
		const currentMonth = moment.utc().format('YYYY-MM');
		return room.v?.activity?.includes(currentMonth) || !(await License.shouldPreventAction('monthlyActiveContacts'));
	}

	async isUnverifiedContact(room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean> {
		if (!isSingleContactEnabled() || !room.v.contactId) {
			return false;
		}

		const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'unknown' | 'channels'>>(room.v.contactId, {
			projection: {
				_id: 1,
				unknown: 1,
				channels: 1,
			},
		});

		// Sanity check, should never happen
		if (!contact) {
			return false;
		}

		if (contact.unknown && settings.get<boolean>('Livechat_Block_Unknown_Contacts')) {
			return true;
		}

		const isContactVerified =
			(contact.channels?.filter((channel) => channel.verified && channel.name === room.source?.type) || []).length > 0;

		if (!isContactVerified && settings.get<boolean>('Livechat_Block_Unverified_Contacts')) {
			return true;
		}

		if (!settings.get<boolean>('Livechat_Request_Verification_On_First_Contact_Only')) {
			return true;
		}

		return false;
	}
}
