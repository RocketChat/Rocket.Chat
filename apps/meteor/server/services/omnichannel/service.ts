import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IOmnichannelService } from '../../sdk/types/IOmnichannelService';
import { hasAnyRole } from '../../../app/authorization/server/functions/hasRole';
import { Livechat } from '../../../app/livechat/server';

export class OmnichannelService extends ServiceClassInternal implements IOmnichannelService {
	protected name = 'omnichannel';

	async started() {
		this.onEvent('presence.status', async ({ user }): Promise<void> => {
			if (!user?._id) {
				return;
			}
			// TODO change `hasAnyRole` to a service call
			if (hasAnyRole(user._id, ['livechat-manager', 'livechat-monitor', 'livechat-agent'])) {
				// TODO change `Livechat.notifyAgentStatusChanged` to a service call
				Livechat.notifyAgentStatusChanged(user._id, user.status);
			}
		});
	}
}
