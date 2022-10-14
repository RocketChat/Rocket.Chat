import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IFederationService } from '../../sdk/types/IFederationService';
import { federationUserServiceSender } from '../../../app/federation-v2/server';

export class FederationService extends ServiceClassInternal implements IFederationService {
	protected name = 'federation';

	async created() {
		this.onEvent('user.typing', async ({ isTyping, roomId, user: { username } }): Promise<void> => {
			if (!roomId || !username) {
				return;
			}

			await federationUserServiceSender.onUserTyping(username, roomId, isTyping);
		});
	}
}
