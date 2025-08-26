import { api, ServiceClassInternal, type IMediaCallService } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { callServer } from '@rocket.chat/media-calls';
import { isClientMediaSignal, type ClientMediaSignal, type ServerMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

const logger = new Logger('media-call service');

export class MediaCallService extends ServiceClassInternal implements IMediaCallService {
	protected name = 'media-call';

	constructor() {
		super();
		callServer.emitter.on('signalRequest', ({ toUid, signal }) => this.sendSignal(toUid, signal));
		callServer.emitter.on('callUpdated', (callId) => api.broadcast('media-call.updated', callId));
		this.onEvent('media-call.updated', (callId) => callServer.receiveCallUpdate(callId));
	}

	public async processSignal(uid: IUser['_id'], signal: ClientMediaSignal): Promise<void> {
		try {
			logger.debug({ msg: 'new client signal', signal, uid });
			callServer.receiveSignal(uid, signal);
		} catch (error) {
			logger.error({ msg: 'failed to process client signal', error, signal, uid });
		}
	}

	public async processSerializedSignal(uid: IUser['_id'], signal: string): Promise<void> {
		try {
			logger.debug({ msg: 'new client signal', signal, uid });

			const deserialized = await this.deserializeClientSignal(signal);

			callServer.receiveSignal(uid, deserialized);
		} catch (error) {
			logger.error({ msg: 'failed to process client signal', error, signal, uid });
		}
	}

	public async hangupExpiredCalls(): Promise<void> {
		await callServer.hangupExpiredCalls().catch((error) => {
			logger.error({ msg: 'Media Call Server failed to hangup expired calls', error });
		});

		if (await MediaCalls.hasUnfinishedCalls()) {
			callServer.scheduleExpirationCheck();
		}
	}

	private async sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): Promise<void> {
		void api.broadcast('user.media-signal', { userId: toUid, signal });
	}

	private async deserializeClientSignal(serialized: string): Promise<ClientMediaSignal> {
		try {
			const signal = JSON.parse(serialized);
			if (!isClientMediaSignal(signal)) {
				throw new Error('signal-format-invalid');
			}
			return signal;
		} catch (error) {
			logger.error({ msg: 'Failed to parse client signal' }, error);
			throw error;
		}
	}
}
