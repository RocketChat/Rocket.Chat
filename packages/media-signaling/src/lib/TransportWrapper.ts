import type {
	MediaSignal,
	MediaSignalAnswer,
	MediaSignalBody,
	MediaSignalBodyAndType,
	MediaSignalHangup,
	MediaSignalNotification,
	MediaSignalType,
} from '../definition/MediaSignal';
import type { MediaSignalTransport } from '../definition/MediaSignalTransport';

export class MediaSignalTransportWrapper {
	constructor(
		public readonly sessionId: string,
		private sendSignalFn: MediaSignalTransport,
	) {}

	public sendToServer<T extends MediaSignalType>(callId: string, type: T, body: MediaSignalBody<T>) {
		return this.sendSignalToServer(callId, {
			type,
			body,
		});
	}

	public sendError(callId: string, errorCode: string) {
		this.sendToServer(callId, 'error', {
			errorCode,
		});
	}

	public answer(callId: string, answer: MediaSignalAnswer['answer']) {
		return this.sendToServer(callId, 'answer', { answer });
	}

	public hangup(callId: string, reason: MediaSignalHangup['reason']) {
		return this.sendToServer(callId, 'hangup', { reason });
	}

	public notify(callId: string, notification: MediaSignalNotification['notification']) {
		return this.sendToServer(callId, 'notification', { notification });
	}

	public sendSignalToServer<T extends MediaSignalType>(callId: string, signal: MediaSignalBodyAndType<T>) {
		return this.sendSignal({
			...signal,
			callId,
			sessionId: this.sessionId,
		});
	}

	public sendSignal(signal: MediaSignal): void {
		console.log('MediaSignalTransport.sendSignal', signal);
		this.sendSignalFn(signal);
	}
}
