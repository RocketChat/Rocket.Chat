import { Users } from '@rocket.chat/models';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IMessageService } from '../../sdk/types/IMessageService';
import { createDirectMessage } from '../../methods/createDirectMessage';

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

	async createDirectMessage({ to, from }: { to: string; from: string }): Promise<{ rid: string }> {
		const toUser = await Users.findOneByUsername(to);
		const fromUser = await Users.findOneByUsername(from);

		if (!toUser || !fromUser) {
			throw new Error('error-invalid-user');
		}
		return createDirectMessage([to], from);
	}
}
