import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { BaseCallProvider } from '../../base/BaseCallProvider';
import type { BroadcastActorAgent } from '../../server/BroadcastAgent';
import type { SipServerSession } from '../Session';

export abstract class BaseSipCall extends BaseCallProvider {
	protected lastCallState: IMediaCall['state'];

	constructor(
		protected readonly session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: BroadcastActorAgent,
		protected readonly channel: IMediaCallChannel,
	) {
		super(call);
		this.lastCallState = 'none';
	}

	public async updateCall(_call: IMediaCall): Promise<void> {
		//
	}

	public async reactToCallChanges(): Promise<void> {
		// If we already knew this call was over, there's nothing more to reflect
		if (this.lastCallState === 'hangup') {
			return;
		}

		const freshCall = await MediaCalls.findOneById(this.call._id);
		if (!freshCall) {
			return;
		}

		// Don't do anything unless our agent has one of the call's signed actors
		const callActor = this.agent.getMyCallActor(freshCall);

		if (!this.agent.isRepresentingActor(callActor) || callActor.contractId !== this.session.sessionId) {
			return;
		}

		return this.reflectCall(freshCall);
	}

	protected abstract reflectCall(call: IMediaCall): Promise<void>;
}
