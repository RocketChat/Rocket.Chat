import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IFederationService } from '../../sdk/types/IFederationService';
import { federationUserServiceSender } from '../../../app/federation-v2/server';

export class FederationService extends ServiceClassInternal implements IFederationService {
	protected name = 'federation';

	async created() {
		this.onEvent('user.avatarUpdate', async ({ username }): Promise<void> => {
			if (!username) {
				return;
			}
			await federationUserServiceSender.afterUserAvatarChanged(username);
		});
	}
}
