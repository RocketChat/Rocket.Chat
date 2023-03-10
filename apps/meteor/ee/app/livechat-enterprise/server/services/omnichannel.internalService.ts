import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IOmnichannelEEService } from '@rocket.chat/core-services';
import type { IOmnichannelRoom, IUser, IMessage } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Subscriptions, Messages, LivechatInquiry } from '@rocket.chat/models';

import { Logger } from '../../../../../app/logger/server';
import { callbacks } from '../../../../../lib/callbacks';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';

export class OmnichannelEE extends ServiceClassInternal implements IOmnichannelEEService {
	protected name = 'omnichannel-ee';

	protected internal = true;

	logger: Logger;

	constructor() {
		super();
		this.logger = new Logger('OmnichannelEE');
	}

	async placeRoomOnHold(
		room: Pick<IOmnichannelRoom, '_id' | 't' | 'open' | 'onHold'>,
		comment: string,
		onHoldBy: Pick<IUser, '_id' | 'username' | 'name'>,
	) {
		this.logger.debug(`Attempting to place room ${room._id} on hold by user ${onHoldBy?._id}`);

		const { _id: roomId } = room;

		if (!room || !isOmnichannelRoom(room)) {
			throw new Error('error-invalid-room');
		}
		if (!room.open) {
			throw new Error('error-room-already-closed');
		}
		if (room.onHold) {
			throw new Error('error-room-is-already-onHold');
		}

		const onHoldByUser: IMessage['u'] = {
			_id: onHoldBy._id,
			username: onHoldBy.username || '',
			name: onHoldBy.name || '',
		};

		await Promise.all([
			LivechatRooms.setOnHoldByRoomId(roomId),
			Subscriptions.setOnHoldByRoomId(roomId),
			Messages.createOnHoldHistoryWithRoomIdMessageAndUser(roomId, onHoldByUser, comment, 'on-hold'),
		]);

		callbacks.run('livechat:afterOnHold', room);

		this.logger.debug(`Room ${room._id} set on hold successfully`);
	}

	async resumeRoomOnHold(
		room: Pick<IOmnichannelRoom, '_id' | 't' | 'open' | 'onHold' | 'servedBy'>,
		comment: string,
		resumeBy: Pick<IUser, '_id' | 'username' | 'name'>,
		clientAction = false,
	) {
		this.logger.debug(`Attempting to resume room ${room._id} on hold by user ${resumeBy?._id}`);

		if (!room || !isOmnichannelRoom(room)) {
			throw new Error('error-invalid-room');
		}

		if (!room.onHold) {
			throw new Error('error-room-not-on-hold');
		}

		const { _id: roomId, servedBy } = room;

		if (!servedBy) {
			this.logger.error(`No serving agent found for room ${roomId}`);
			throw new Error('error-room-not-served');
		}

		const inquiry = await LivechatInquiry.findOneByRoomId(roomId, {});
		if (!inquiry) {
			this.logger.error(`No inquiry found for room ${roomId}`);
			throw new Error('error-invalid-inquiry');
		}

		const { _id: agentId, username } = servedBy;

		await RoutingManager.takeInquiry(
			inquiry,
			{
				agentId,
				username,
			},
			{
				clientAction,
			},
		);

		const resumeByUser: IMessage['u'] = {
			_id: resumeBy._id,
			username: resumeBy.username || '',
			name: resumeBy.name || '',
		};

		await Promise.all([
			LivechatRooms.unsetOnHoldByRoomId(roomId),
			Subscriptions.unsetOnHoldByRoomId(roomId),
			Messages.createOnHoldHistoryWithRoomIdMessageAndUser(roomId, resumeByUser, comment, 'resume-onHold'),
		]);

		callbacks.run('livechat:afterOnHoldChatResumed', room);

		this.logger.debug(`Room ${room._id} resumed successfully`);
	}
}
