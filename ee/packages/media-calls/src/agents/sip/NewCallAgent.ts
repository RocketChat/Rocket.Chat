import type { IMediaCall } from '@rocket.chat/core-typings';
import type { CallContact } from '@rocket.chat/media-signaling';

import { SipBasicAgent } from './BasicAgent';
import { logger } from '../../logger';
import type { INewMediaCallAgent } from '../definition/IMediaCallAgent';

export class SipNewCallAgent extends SipBasicAgent implements INewMediaCallAgent {
	public async onNewCall(call: IMediaCall, _oppositeContact: CallContact): Promise<void> {
		logger.debug({ msg: 'SipNewCallAgent.onNewCall', call, contractId: this.contractId });

		if (this.role === 'callee') {
			// #ToDo: request an offer from the caller
		}
	}
}
