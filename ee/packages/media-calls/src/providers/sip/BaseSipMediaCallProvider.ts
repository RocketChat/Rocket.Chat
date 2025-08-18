import { MediaCalls } from "@rocket.chat/models";
import { logger } from "../../logger";
import { InternalServerError } from "../common";
import { IMediaCall } from "@rocket.chat/core-typings";
import { BaseMediaCallProvider } from "../BaseMediaCallProvider";

export abstract class BaseSipMediaCallProvider extends BaseMediaCallProvider {
	protected callId: string | null;

	protected channelId: string | null;

	protected lastCallState: IMediaCall['state'];

	public readonly actorType = 'sip';

	constructor() {
		super();

		this.callId = null;
		this.channelId = null;
		this.lastCallState = 'none';
	}

	public async reactToCallChanges(): Promise<void> {
		logger.debug({ msg: 'BaseSipMediaCallProvider.reactToCallChanges', callId: this.callId, lastCallState: this.lastCallState });
		this.requireCallId('reactToCallChanges');

		// If we already hung up this call, then there's nothing more to update
		if (this.lastCallState === 'hangup') {
			return;
		}

		const call = await MediaCalls.findOneById(this.callId);
		if (!call) {
			logger.error({
				msg: `Could not find the call data`,
				method: 'BaseSipMediaCallProvider.reactToCallChanges',
				callId: this.callId,
				lastCallState: this.lastCallState,
			});
			throw new InternalServerError('invalid-call');
		}

		return this.reflectCall(call);
	}

	protected setCallId(callId: string): asserts this is typeof this & { callId: string } {
		this.callId = callId;
	}

	protected requireCallId(methodName?: string): asserts this is typeof this & { callId: string } {
		if (this.callId) {
			return;
		}

		logger.error({
			msg: `This method requires a callId`,
			method: `BaseSipMediaCallProvider.${methodName || 'requireCallId'}`,
		});
		throw new InternalServerError('invalid-call');
	}

	protected requireChannelId(methodName?: string): asserts this is typeof this & { channelId: string } {
		const method = methodName || 'requireChannelId';
		this.requireCallId(method);

		if (this.channelId) {
			return;
		}

		logger.error({
			msg: `This method requires a channelId`,
			method,
		});
		throw new Error('invalid-channel');
	}

	protected async onCallCreated(call: IMediaCall): Promise<IMediaCall> {
		logger.debug({ msg: 'SipIncomingMediaCallProvider.onCallCreated', call });
		this.setCallId(call._id);
		this.lastCallState = call.state;

		try {
			await this.createContract();
		} catch (error) {
			logger.error({ msg: 'Failed to create initial channel for SIP actor', callId: call._id, error, role: this.supportedRoles[0] });
			await MediaCalls.hangupCallById(call._id, { endedBy: { type: 'server', id: 'server' }, reason: 'error' });
			throw error;
		}

		return call;
	}

	/**
	 * Create the contract for this role and call and set the channelId property
	 */
	protected abstract createContract(): Promise<void>;

	protected abstract reflectCall(call: IMediaCall): Promise<void>;
}
