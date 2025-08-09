import { api, ServiceClassInternal, type IMediaCallService } from '@rocket.chat/core-services';
import type { IUser, IMediaCall } from '@rocket.chat/core-typings';
import { isClientMediaSignal, type ClientMediaSignal, type ServerMediaSignal } from '@rocket.chat/media-signaling';
import { processSignal, createCall, setSignalHandler, logger } from '@rocket.chat/media-signaling-server';
import { MediaCalls, Users } from '@rocket.chat/models';

export class MediaCallService extends ServiceClassInternal implements IMediaCallService {
	protected name = 'media-call';

	constructor() {
		super();
		setSignalHandler(this.sendSignal.bind(this));
	}

	public async processSignal(uid: IUser['_id'], signal: ClientMediaSignal): Promise<void> {
		try {
			logger.debug({ msg: 'new client signal', signal, uid });
			await processSignal(signal, uid);
		} catch (error) {
			logger.error({ msg: 'failed to process client signal', error, signal, uid });
		}
	}

	public async processSerializedSignal(uid: IUser['_id'], signal: string): Promise<void> {
		try {
			logger.debug({ msg: 'new client signal', signal, uid });

			const deserialized = await this.deserializeClientSignal(signal);

			await processSignal(deserialized, uid);
		} catch (error) {
			logger.error({ msg: 'failed to process client signal', error, signal, uid });
		}
	}

	public async createInternalCall(caller: { uid: IUser['_id']; contractId: string }, callee: { uid: IUser['_id'] }): Promise<IMediaCall> {
		const user = await Users.findOneActiveById(callee.uid, { projection: { _id: 1 } });
		if (!user) {
			throw new Error('invalid-user');
		}

		return createCall({
			caller: {
				type: 'user',
				id: caller.uid,
				contractId: caller.contractId,
			},
			callee: { type: 'user', id: callee.uid },
		});
	}

	public async callExtension(caller: { uid: IUser['_id']; contractId: string }, extension: string): Promise<IMediaCall> {
		const user = await Users.findOneByFreeSwitchExtension(extension, { projection: { _id: 1 } });
		if (!user) {
			throw new Error('invalid-user');
		}

		return createCall({
			caller: {
				type: 'user',
				id: caller.uid,
				contractId: caller.contractId,
			},
			callee: { type: 'user', id: user._id },
		});
	}

	public async callUser(caller: { uid: IUser['_id']; contractId: string }, userId: IUser['_id']): Promise<IMediaCall> {
		// For now every call is between two users
		return this.createInternalCall(caller, { uid: userId });
	}

	public async hangupEveryCall(hangupReason?: string): Promise<void> {
		// change every pending or active call state to 'hangup' with the specified reason

		await MediaCalls.hangupEveryCall({
			endedBy: { type: 'server', id: 'server' },
			reason: hangupReason || 'full-server-hangup',
		});
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
