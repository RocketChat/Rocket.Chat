import type { IMediaCall } from '@rocket.chat/core-typings';
import type { CallContact } from '@rocket.chat/media-signaling';

import { UserBasicAgent } from './BasicAgent';
import { logger } from '../../logger';
import { agentManager } from '../Manager';
import type { INewMediaCallAgent } from '../definition/IMediaCallAgent';

export class UserNewCallAgent extends UserBasicAgent implements INewMediaCallAgent {
	public async onNewCall(call: IMediaCall, oppositeContact: CallContact): Promise<void> {
		logger.debug({ msg: 'UserNewCallAgent.onNewCall', call, contractId: this.contractId });
		// If we have a contract id, ensure the contract is registered
		if (this.contractId) {
			await agentManager.getOrCreateContract(call._id, this);
		}

		await this.sendNewSignal(call, oppositeContact);
	}

	private async sendNewSignal(call: IMediaCall, contact: CallContact): Promise<void> {
		logger.debug({ msg: 'UserNewCallAgent.sendNewSignal', call });

		return this.sendSignal({
			callId: call._id,
			type: 'new',
			service: call.service,
			kind: call.kind,
			role: this.role,
			contact,

			...(this.role === 'caller' && call.callerRequestedId && { requestedCallId: call.callerRequestedId }),
		});
	}
}
