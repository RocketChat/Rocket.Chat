import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import type { ClientMediaSignalBody } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';
import type Srf from 'drachtio-srf';

import { BaseCallProvider } from '../../base/BaseCallProvider';
import { logger } from '../../logger';
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

	public override async reactToCallChanges(params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void> {
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

		return this.reflectCall(freshCall, params);
	}

	protected abstract reflectCall(call: IMediaCall, params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void>;

	protected async sendDTMF(dialog: Srf.Dialog, dtmf: string, duration: number): Promise<void> {
		logger.debug({ msg: 'BaseSipCall.sendDTMF' });
		await dialog.request({
			method: 'INFO',
			headers: {
				'Content-Type': 'application/dtmf-relay',
			},
			body: `Signal=${dtmf}\r\nDuration=${duration}`,
		});
	}
}
