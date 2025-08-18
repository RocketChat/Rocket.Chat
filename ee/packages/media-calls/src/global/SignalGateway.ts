import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { isClientMediaSignal } from '@rocket.chat/media-signaling';
import type { ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

import { logger } from '../logger';
import type { ISignalGateway, ServerSignalTransport, SignalGatewayEvents } from './ISignalGateway';
import { GlobalSignalProcessor } from './SignalProcessor';
import { SipServerSession } from '../agents/sip/server/Session';
import { CreateCallParams } from '../providers/IMediaCallProvider';
import { SipOutgoingMediaCallProvider } from '../providers/sip/SipOutgoingMediaCallProvider';
import { UserMediaCallProvider } from '../providers/users/UserMediaCallProvider';

/**
 * Class used as gateway to send and receive signals to/from clients
 * The actual function used to send the signals needs to be set by the server
 */
export class SignalGateway extends GlobalSignalProcessor implements ISignalGateway {
	private handler: ServerSignalTransport | null = null;

	private session: SipServerSession;

	public emitter: Emitter<SignalGatewayEvents>;

	constructor() {
		super();
		this.emitter = new Emitter();
		this.session = new SipServerSession();
	}

	public setSignalHandler(handlerFn: ServerSignalTransport): void {
		this.handler = handlerFn;
	}

	public receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): void {
		logger.debug({ msg: 'SignalGateway.receiveSignal', signal, fromUid });

		if (!isClientMediaSignal(signal)) {
			this.debugError('The Media Signal Server received an invalid client signal object', { signal });
			throw new Error('invalid-signal');
		}

		this.processSignal(fromUid, signal).catch((error) =>
			this.debugError('Failed to process client signal', { signal }, { error, type: signal.type }),
		);
	}

	public sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void {
		logger.debug({ msg: 'SignalGateway.sendSignal', toUid, signal });

		if (!this.handler) {
			this.debugError('The Media Signal Server tried to send a signal to a client without being configured first.', { signal });
			throw new Error('media-calls-server-not-configured');
		}

		try {
			this.handler(toUid, signal);
		} catch (error) {
			this.debugError(`SignalGateway's handler threw an exception`, { toUid, signal }, { error });
		}
	}

	public async createCall(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'GlobalSignalProcessor.createCall', params });

		if (params.callee.type === 'sip') {
			const sipProvider = new SipOutgoingMediaCallProvider(this.session, params.callee);
			return sipProvider.createCall(params);
		}

		const callProvider = new UserMediaCallProvider();

		return callProvider.createCall(params);
	}

	public reactToCallUpdate(callId: string): void {
		this.session.reactToCallUpdate(callId);
	}

	private debugError(msg: string, debugInfo: Record<string, unknown>, errorInfo?: Record<string, unknown>): void {
		logger.error({ msg, ...errorInfo });
		logger.debug({ msg: `${msg} - debug info`, ...debugInfo });
	}
}

export const gateway = new SignalGateway();
