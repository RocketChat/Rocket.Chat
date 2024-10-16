import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IOmnichannelService } from '@rocket.chat/core-services';
import type { AtLeast, IOmnichannelQueue, IOmnichannelRoom, ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts } from '@rocket.chat/models';
import moment from 'moment';

import { ContactMerger } from '../../../app/livechat/server/lib/ContactMerger';
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

	async mergeContacts(contactId: string, channel: ILivechatContactChannel): Promise<ILivechatContact | null> {
		const originalContact = (await LivechatContacts.findOneById(contactId)) as ILivechatContact;

		const similarContacts: ILivechatContact[] = await LivechatContacts.findSimilarVerifiedContacts(channel, contactId);

		if (!similarContacts.length) {
			return originalContact;
		}

		for await (const similarContact of similarContacts) {
			await ContactMerger.mergeContact(originalContact, similarContact);
		}

		await LivechatContacts.deleteMany({ _id: { $in: similarContacts.map((c) => c._id) } });
		return LivechatContacts.findOneById(contactId);
	}

	async verifyContactChannel(_params: {
		contactId: string;
		field: string;
		value: string;
		channelName: string;
		visitorId: string;
		roomId: string;
	}): Promise<ILivechatContact | null> {
		return null;
	}
}
