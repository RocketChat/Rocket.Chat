import type { IMediaCall } from '@rocket.chat/core-typings';

import { UserBasicAgent } from './BasicAgent';
import { logger } from '../../logger';
import { agentManager } from '../Manager';
import type { IMediaCallBasicAgent, INewMediaCallAgent } from '../definition/IMediaCallAgent';

export class UserNewCallAgent extends UserBasicAgent implements INewMediaCallAgent {
	public async onNewCall(call: IMediaCall, otherAgent: IMediaCallBasicAgent): Promise<void> {
		logger.debug({ msg: 'UserNewCallAgent.onNewCall', call, contractId: this.contractId });
		// If we have a contract id, ensure the contract is registered
		if (this.contractId) {
			await agentManager.getOrCreateContract(call._id, this);
		}

		await this.sendNewSignal(call, otherAgent);
	}

	private async sendNewSignal(call: IMediaCall, otherAgent: IMediaCallBasicAgent): Promise<void> {
		logger.debug({ msg: 'UserNewCallAgent.sendNewSignal', call });
		const contact = await otherAgent.getContactInfo();

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
