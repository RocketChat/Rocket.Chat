import type { CallAnswer, CallHangupReason } from '../definition';
import type { IMediaSignalLogger } from '../definition/logger';
import type {
	MediaSignalTransport,
	ClientMediaSignalType,
	ClientMediaSignalBody,
	GenericClientMediaSignal,
	ClientMediaSignal,
} from '../definition/signals';

export class MediaSignalTransportWrapper {
	constructor(
		public readonly contractId: string,
		private sendSignalFn: MediaSignalTransport<ClientMediaSignal>,
		private logger?: IMediaSignalLogger,
	) {}

	public sendToServer<T extends ClientMediaSignalType>(callId: string, type: T, signal: ClientMediaSignalBody<T>) {
		this.logger?.debug('MediaSignalTransportWrapper.sendToServer', type);
		return this.sendSignal({
			callId,
			contractId: this.contractId,
			type,
			...signal,
		} as GenericClientMediaSignal<T>);
	}

	public sendError(callId: string, errorCode: string) {
		this.sendToServer(callId, 'error', { errorCode });
	}

	public answer(callId: string, answer: CallAnswer) {
		return this.sendToServer(callId, 'answer', { answer });
	}

	public hangup(callId: string, reason: CallHangupReason) {
		return this.sendToServer(callId, 'hangup', { reason });
	}

	public sendSignal(signal: ClientMediaSignal): void {
		this.logger?.debug('MediaSignalTransportWrapper.sendSignal', signal);
		this.sendSignalFn(signal);
	}
}
