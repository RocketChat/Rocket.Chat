import { api, ServiceClassInternal, type IMediaCallService } from '@rocket.chat/core-services';
import type { IUser, IMediaCall, IRoom } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';
import { processSignal, createCall, setSignalHandler } from '@rocket.chat/media-signaling-server';
import { Rooms } from '@rocket.chat/models';

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

	private async sendSignal(toUid: IUser['_id'], signal: MediaSignal): Promise<void> {
		void api.broadcast('user.media-signal', { userId: toUid, signal });
	}
}
