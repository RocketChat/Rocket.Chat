import { api, ServiceClassInternal, type IMediaCallService } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { callServer, type IMediaCallServerSettings } from '@rocket.chat/media-calls';
import { isClientMediaSignal, type ClientMediaSignal, type ServerMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';

const logger = new Logger('media-call service');

export class MediaCallService extends ServiceClassInternal implements IMediaCallService {
	protected name = 'media-call';

	constructor() {
		super();
		callServer.emitter.on('signalRequest', ({ toUid, signal }) => this.sendSignal(toUid, signal));

		this.onEvent('watch.settings', async ({ setting }): Promise<void> => {
			if (setting._id.startsWith('VoIP_TeamCollab_')) {
				setImmediate(() => this.configureMediaCallServer());
			}
		});

		this.configureMediaCallServer();
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

	private configureMediaCallServer(): void {
		callServer.configure(this.getMediaServerSettings());
	}

	private getMediaServerSettings(): IMediaCallServerSettings {
		const enabled = settings.get<boolean>('VoIP_TeamCollab_Enabled') ?? false;
		const sipEnabled = false;
		const forceSip = false;

		return {
			enabled,
			internalCalls: {
				requireExtensions: forceSip,
				routeExternally: forceSip ? 'always' : 'never',
			},
			sip: {
				enabled: sipEnabled,
			},
		};
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
