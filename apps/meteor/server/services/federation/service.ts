import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IFederationService } from '../../sdk/types/IFederationService';
import { federationUserServiceSender } from '../../../app/federation-v2/server';
import { settings } from '../../../app/settings/server';

export class FederationService extends ServiceClassInternal implements IFederationService {
	protected name = 'federation';

	async created() {
		this.onEvent('user.avatarUpdate', async ({ username }): Promise<void> => {
			if (!settings.get('Federation_Matrix_enabled')) {
				return;
			}
			if (!username) {
				return;
			}
			await federationUserServiceSender.afterUserAvatarChanged(username);
		});
		this.onEvent('user.typing', async ({ isTyping, roomId, user: { username } }): Promise<void> => {
			if (!roomId || !username) {
				return;
			}

			await federationUserServiceSender.onUserTyping(username, roomId, isTyping);
		});
		this.onEvent('user.realNameChanged', async ({ _id, name }): Promise<void> => {
			if (!settings.get('Federation_Matrix_enabled')) {
				return;
			}
			if (!name || !_id) {
				return;
			}
			await federationUserServiceSender.afterUserRealNameChanged(_id, name);
		});
	}
}
