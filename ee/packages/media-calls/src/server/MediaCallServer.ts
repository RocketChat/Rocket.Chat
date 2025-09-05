import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { isClientMediaSignal } from '@rocket.chat/media-signaling';
import type { ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

import { MediaCallDirector } from './CallDirector';
import type { IMediaCallServer, IMediaCallServerSettings, MediaCallServerEvents } from '../definition/IMediaCallServer';
import type { InternalCallParams } from '../definition/common';
import { InternalCallProvider } from '../internal/InternalCallProvider';
import { GlobalSignalProcessor } from '../internal/SignalProcessor';
import { logger } from '../logger';

/**
 * Class used as gateway to send and receive signals to/from clients
 * The actual function used to send the signals needs to be set by the server
 */
export class MediaCallServer implements IMediaCallServer {
	private signalProcessor: GlobalSignalProcessor;

	public emitter: Emitter<MediaCallServerEvents>;

	constructor() {
		this.emitter = new Emitter();
		this.signalProcessor = new GlobalSignalProcessor();

		this.signalProcessor.emitter.on('signalRequest', ({ toUid, signal }) => {
			this.sendSignal(toUid, signal);
		});
		this.signalProcessor.emitter.on('callRequest', ({ fromUid, params }) => {
			this.onCallRequest(fromUid, params);
		});
	}

	public receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): void {
		logger.debug({ msg: 'MediaCallServer.receiveSignal', signal, fromUid });

		if (!isClientMediaSignal(signal)) {
			logger.error({ msg: 'The Media Signal Server received an invalid client signal object' });
			throw new Error('invalid-signal');
		}

		this.signalProcessor.processSignal(fromUid, signal).catch((error) => {
			logger.error({ msg: 'Failed to process client signal', error, type: signal.type });
		});
	}

	public sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void {
		logger.debug({ msg: 'MediaCallServer.sendSignal', toUid, signal });

		this.emitter.emit('signalRequest', { toUid, signal });
	}

	public async createCall(params: InternalCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'MediaCallServer.createCall', params });

		if (params.callee.type === 'sip') {
			throw new Error('Outgoing SIP calls are not yet implemented.');
		}

		return InternalCallProvider.createCall(params);
	}

	public async hangupExpiredCalls(): Promise<void> {
		return MediaCallDirector.hangupExpiredCalls();
	}

	public scheduleExpirationCheck(): void {
		return MediaCallDirector.scheduleExpirationCheck();
	}

	public configure(settings: IMediaCallServerSettings): void {
		logger.debug({ msg: 'Media Server Configuration', settings });
		this.signalProcessor.configure(settings);
	}

	private onCallRequest(fromUid: IUser['_id'], params: InternalCallParams): void {
		this.createCall(params).catch((error) => {
			logger.error({ msg: 'Failed to create a call requested by a signal', fromUid, params, error });

			if (params.requestedCallId) {
				this.sendSignal(fromUid, {
					type: 'rejected-call-request',
					callId: params.requestedCallId,
					toContractId: params.caller.contractId,
					reason: 'unsupported',
				});
			}
			throw error;
		});
	}
}
