import { ServiceClassInternal, Message } from '@rocket.chat/core-services';
import type { IOmnichannelEEService } from '@rocket.chat/core-services';
import { isOmnichannelRoom, LivechatInquiryStatus } from '@rocket.chat/core-typings';
import type { IOmnichannelRoom, IUser, ILivechatInquiryRecord, IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatRooms, Subscriptions, LivechatInquiry } from '@rocket.chat/models';

import {
	notifyOnSubscriptionChangedByRoomId,
	notifyOnLivechatInquiryChangedById,
	notifyOnRoomChangedById,
} from '../../../../../app/lib/server/lib/notifyListener';
import { dispatchAgentDelegated } from '../../../../../app/livechat/server/lib/Helper';
import { queueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';
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
		const restrictedOnHold = settings.get('Livechat_allow_manual_on_hold_upon_agent_engagement_only');
		const canRoomBePlacedOnHold = !room.onHold;
		const canAgentPlaceOnHold = !room.lastMessage?.token;
		const canPlaceChatOnHold = canRoomBePlacedOnHold && (!restrictedOnHold || canAgentPlaceOnHold);
		if (!canPlaceChatOnHold) {
			throw new Error('error-cannot-place-chat-on-hold');
		}
		if (!room.servedBy) {
			throw new Error('error-unserved-rooms-cannot-be-placed-onhold');
		}

		const [roomResult, subsResult] = await Promise.all([
			LivechatRooms.setOnHoldByRoomId(roomId),
			Subscriptions.setOnHoldByRoomId(roomId),
			Message.saveSystemMessage<IOmnichannelSystemMessage>('omnichannel_placed_chat_on_hold', roomId, '', onHoldBy, { comment }),
		]);

		if (roomResult.modifiedCount) {
			void notifyOnRoomChangedById(roomId);
		}

		if (subsResult.modifiedCount) {
			void notifyOnSubscriptionChangedByRoomId(roomId);
		}

		await callbacks.run('livechat:afterOnHold', room);
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

		const [roomResult, subsResult] = await Promise.all([
			LivechatRooms.unsetOnHoldByRoomId(roomId),
			Subscriptions.unsetOnHoldByRoomId(roomId),
			Message.saveSystemMessage<IOmnichannelSystemMessage>('omnichannel_on_hold_chat_resumed', roomId, '', resumeBy, { comment }),
		]);

		if (roomResult.modifiedCount) {
			void notifyOnRoomChangedById(roomId);
		}

		if (subsResult.modifiedCount) {
			void notifyOnSubscriptionChangedByRoomId(roomId);
		}

		await callbacks.run('livechat:afterOnHoldChatResumed', room);
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
			this.logger.error(`Agent ${servingAgent._id} is not available to take the inquiry ${inquiry._id}`, e);
			if (clientAction) {
				// if the action was triggered by the client, we should throw the error
				// so the client can handle it and show the error message to the user
				throw e;
			}
		}

		await this.removeCurrentAgentFromRoom({ room, inquiry });

		const { _id: inquiryId } = inquiry;
		const newInquiry = await LivechatInquiry.findOneById(inquiryId);

		if (!newInquiry) {
			throw new Error('error-invalid-inquiry');
		}
		await queueInquiry(newInquiry);
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

		void notifyOnLivechatInquiryChangedById(inquiryId, 'updated', {
			status: LivechatInquiryStatus.QUEUED,
			queuedAt: new Date(),
			takenAt: undefined,
			defaultAgent: undefined,
		});

		await dispatchAgentDelegated(roomId);

		void notifyOnRoomChangedById(roomId);
	}
}
