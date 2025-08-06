import type {
	MediaSignal,
	MediaSignalAnswer,
	MediaSignalHangup,
	AgentMediaSignalType,
	MediaSignalBody,
	AgentMediaSignal,
} from '../definition/MediaSignal';
import type { MediaSignalAgentTransport } from '../definition/MediaSignalTransport';

export class MediaSignalTransportWrapper {
	constructor(
		public readonly contractId: string,
		private sendSignalFn: MediaSignalAgentTransport,
	) {}

	public sendToServer<T extends AgentMediaSignalType>(callId: string, type: T, signal: MediaSignalBody<T>) {
		return this.sendSignal({
			callId,
			contractId: this.contractId,
			type,
			...signal,
		} as MediaSignal<T>);
	}

	public sendError(callId: string, errorCode: string) {
		this.sendToServer(callId, 'error', { errorCode });
	}

	public answer(callId: string, answer: MediaSignalAnswer['answer']) {
		return this.sendToServer(callId, 'answer', { answer });
	}

	public hangup(callId: string, reason: MediaSignalHangup['reason']) {
		return this.sendToServer(callId, 'hangup', { reason });
	}

	public sendSignal(signal: AgentMediaSignal): void {
		console.log('MediaSignalTransport.sendSignal', signal);
		this.sendSignalFn(signal);
	}
}
