import { api, ServiceClassInternal, type IMediaCallService } from '@rocket.chat/core-services';
import type { IUser, IMediaCall, IRoom } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';
import { processSignal, createCall, setSignalHandler } from '@rocket.chat/media-signaling-server';
import { Rooms, Users } from '@rocket.chat/models';

export class MediaCallService extends ServiceClassInternal implements IMediaCallService {
	protected name = 'media-call';

	constructor() {
		super();
		setSignalHandler(this.sendSignal.bind(this));
	}

	public async processSignal(signal: MediaSignal, uid: IUser['_id']): Promise<void> {
		return processSignal(signal, uid);
	}

	public async createInternalCall(caller: { uid: IUser['_id']; sessionId: string }, callee: { uid: IUser['_id'] }): Promise<IMediaCall> {
		const user = await Users.findOneActiveById(callee.uid, { projection: { _id: 1 } });
		if (!user) {
			throw new Error('invalid-user');
		}

		return createCall(
			{
				type: 'user',
				id: caller.uid,
				sessionId: caller.sessionId,
			},
			{ type: 'user', id: callee.uid },
		);
	}

	public async callRoom(caller: { uid: IUser['_id']; sessionId: string }, roomId: IRoom['_id']): Promise<IMediaCall> {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'uids'>>(roomId, { projection: { t: 1, uids: 1 } });
		if (room?.t !== 'd') {
			throw new Error('invalid-room');
		}
		const calleeId = room.uids?.filter((uid) => uid !== caller.uid).pop();
		if (!calleeId) {
			throw new Error('invalid-room');
		}

		return this.createInternalCall(caller, { uid: calleeId });
	}

	public async callExtension(caller: { uid: IUser['_id']; sessionId: string }, extension: string): Promise<IMediaCall> {
		const user = await Users.findOneByFreeSwitchExtension(extension, { projection: { _id: 1 } });
		if (!user) {
			throw new Error('invalid-user');
		}

		return createCall(
			{
				type: 'user',
				id: caller.uid,
				sessionId: caller.sessionId,
			},
			{ type: 'user', id: user._id },
		);
	}

	public async callUser(caller: { uid: IUser['_id']; sessionId: string }, userId: IUser['_id']): Promise<IMediaCall> {
		// For now every call is between two users
		return this.createInternalCall(caller, { uid: userId });
	}

	private async sendSignal(toUid: IUser['_id'], signal: MediaSignal): Promise<void> {
		void api.broadcast('user.media-signal', { userId: toUid, signal });
	}
}
