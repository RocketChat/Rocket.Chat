import type { MediaSignalTransport } from '../definition/MediaSignalTransport';
import type { ClientMediaSignal, MediaSignal } from '../definition/signal/MediaSignal';
import type { DeliverBody, DeliverParams, DeliverType } from '../definition/signal/MediaSignalDeliver';
import type { MediaSignalHeaderParams } from '../definition/signal/MediaSignalHeader';
import type { NotifyBody, NotifyParams, NotifyType } from '../definition/signal/MediaSignalNotify';

export class MediaSignalTransportWrapper {
	private readonly version = 1.0;

	constructor(
		public readonly sessionId: string,
		private sendSignalFn: MediaSignalTransport,
	) {}

	public deliverToServer<T extends DeliverType>(requestSignal: MediaSignal, type: T, params: DeliverParams<T>) {
		return this.sendSignalToServer(
			{
				type: 'deliver',
				body: {
					deliver: type,
					...params,
				} as DeliverBody<T>,
			},
			requestSignal,
		);
	}

	public notifyServer<T extends NotifyType>(requestSignal: MediaSignal, type: T, params?: NotifyParams<T>) {
		return this.sendSignalToServer(
			{
				type: 'notify',
				body: {
					notify: type,
					...params,
				} as NotifyBody<T>,
			},
			requestSignal,
		);
	}

	public sendError(requestSignal: MediaSignal, errorCode: string, errorText?: string) {
		this.notifyServer(requestSignal, 'error', {
			errorCode,
			...(errorText && { errorText }),
		});
	}

	public sendSignalToServer<T extends MediaSignal>(signal: ClientMediaSignal<T>, requestSignal: MediaSignal) {
		const header: MediaSignalHeaderParams = {
			callId: requestSignal.callId,
			sequence: requestSignal.sequence,
			role: requestSignal.role,
			version: this.version,
			sessionId: this.sessionId,
		};

		const newSignal = {
			...signal,
			...header,
		} as T;

		return this.sendSignal(newSignal);
	}

	public sendSignal(signal: MediaSignal): void {
		console.log('MediaSignalTransport.sendSignal', signal);
		this.sendSignalFn(signal);
	}
}
