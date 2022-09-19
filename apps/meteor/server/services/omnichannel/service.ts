import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IOmnichannelService } from '../../sdk/types/IOmnichannelService';
import { Livechat } from '../../../app/livechat/server';

export class OmnichannelService extends ServiceClassInternal implements IOmnichannelService {
	protected name = 'omnichannel';

	async created() {
		this.onEvent('presence.status', async ({ user }): Promise<void> => {
			if (!user?._id) {
				return;
			}
			const hasRole = user.roles.some((role) => ['livechat-manager', 'livechat-monitor', 'livechat-agent'].includes(role));
			if (hasRole) {
				// TODO change `Livechat.notifyAgentStatusChanged` to a service call
				Livechat.notifyAgentStatusChanged(user._id, user.status);
			}
		});
	}
}
