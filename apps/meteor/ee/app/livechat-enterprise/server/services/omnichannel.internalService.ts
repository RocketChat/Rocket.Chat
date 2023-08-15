import { ServiceClassInternal, Message } from '@rocket.chat/core-services';
import type { IOmnichannelEEService } from '@rocket.chat/core-services';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IOmnichannelRoom, IUser, ILivechatInquiryRecord, IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatRooms, Subscriptions, LivechatInquiry } from '@rocket.chat/models';

import { dispatchAgentDelegated } from '../../../../../app/livechat/server/lib/Helper';
import { queueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { callbacks } from '../../../../../lib/callbacks';

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
			throw new Error('error-room-is-already-on-hold');
		}
		if (room.lastMessage?.token) {
			throw new Error('error-contact-sent-last-message-so-cannot-place-on-hold');
		}
		if (!room.servedBy) {
			throw new Error('error-unserved-rooms-cannot-be-placed-onhold');
		}

		await Promise.all([
			LivechatRooms.setOnHoldByRoomId(roomId),
			Subscriptions.setOnHoldByRoomId(roomId),
			Message.saveSystemMessage<IOmnichannelSystemMessage>('omnichannel_placed_chat_on_hold', roomId, '', onHoldBy, { comment }),
		]);

		await callbacks.run('livechat:afterOnHold', room);

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

		if (!room.open) {
			throw new Error('This_conversation_is_already_closed');
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

		await this.attemptToAssignRoomToServingAgentElseQueueIt({
			room,
			inquiry,
			servingAgent: servedBy,
			clientAction,
		});

		await Promise.all([
			LivechatRooms.unsetOnHoldByRoomId(roomId),
			Subscriptions.unsetOnHoldByRoomId(roomId),
			Message.saveSystemMessage<IOmnichannelSystemMessage>('omnichannel_on_hold_chat_resumed', roomId, '', resumeBy, { comment }),
		]);

		await callbacks.run('livechat:afterOnHoldChatResumed', room);

		this.logger.debug(`Room ${room._id} resumed successfully`);
	}

	private async attemptToAssignRoomToServingAgentElseQueueIt({
		room,
		inquiry,
		servingAgent,
		clientAction,
	}: {
		room: Pick<IOmnichannelRoom, '_id'>;
		inquiry: ILivechatInquiryRecord;
		servingAgent: NonNullable<IOmnichannelRoom['servedBy']>;
		clientAction: boolean;
	}) {
		try {
			const agent = {
				agentId: servingAgent._id,
				username: servingAgent.username,
			};

			await callbacks.run('livechat.checkAgentBeforeTakeInquiry', {
				agent,
				inquiry,
				options: {},
			});

			return;
		} catch (e) {
			this.logger.debug(`Agent ${servingAgent._id} is not available to take the inquiry ${inquiry._id}`, e);
			if (clientAction) {
				// if the action was triggered by the client, we should throw the error
				// so the client can handle it and show the error message to the user
				throw e;
			}
		}

		this.logger.debug(`Attempting to queue inquiry ${inquiry._id}`);

		await this.removeCurrentAgentFromRoom({ room, inquiry });

		const { _id: inquiryId } = inquiry;
		const newInquiry = await LivechatInquiry.findOneById(inquiryId);

		await queueInquiry(newInquiry);

		this.logger.debug('Room queued successfully');
	}

	private async removeCurrentAgentFromRoom({
		room,
		inquiry,
	}: {
		room: Pick<IOmnichannelRoom, '_id'>;
		inquiry: ILivechatInquiryRecord;
	}): Promise<void> {
		this.logger.debug(`Attempting to remove current agent from room ${room._id}`);

		const { _id: roomId } = room;

		const { _id: inquiryId } = inquiry;

		await Promise.all([
			LivechatRooms.removeAgentByRoomId(roomId),
			LivechatInquiry.queueInquiryAndRemoveDefaultAgent(inquiryId),
			RoutingManager.removeAllRoomSubscriptions(room),
		]);

		await dispatchAgentDelegated(roomId, null);

		this.logger.debug(`Current agent removed from room ${room._id} successfully`);
	}
}
