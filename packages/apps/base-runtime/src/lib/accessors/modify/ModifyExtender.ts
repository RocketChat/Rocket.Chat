import type { IMessageExtender } from '@rocket.chat/apps-engine/definition/accessors/IMessageExtender.js';
import type { IModifyExtender } from '@rocket.chat/apps-engine/definition/accessors/IModifyExtender.js';
import type { IRoomExtender } from '@rocket.chat/apps-engine/definition/accessors/IRoomExtender.js';
import type { IVideoConferenceExtender } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceExtend.js';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.js';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.js';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser.js';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConference.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';
import { MessageExtender } from '../extenders/MessageExtender.js';
import { RoomExtender } from '../extenders/RoomExtender.js';
import { VideoConferenceExtender } from '../extenders/VideoConferenceExtend.js';

export class ModifyExtender implements IModifyExtender {
	private readonly senderFn: typeof Messenger.sendRequest;

	constructor(senderFn: typeof Messenger.sendRequest) {
		this.senderFn = senderFn;
	}

	public async extendMessage(messageId: string, updater: IUser): Promise<IMessageExtender> {
		const msg = (await bridgeCall(this.senderFn, 'getMessageBridge', 'doGetById', messageId, 'APP_ID')) as IMessage;

		msg.editor = updater;
		msg.editedAt = new Date();

		return new MessageExtender(msg);
	}

	public async extendRoom(roomId: string, _updater: IUser): Promise<IRoomExtender> {
		const room = (await bridgeCall(this.senderFn, 'getRoomBridge', 'doGetById', roomId, 'APP_ID')) as IRoom;

		room.updatedAt = new Date();

		return new RoomExtender(room);
	}

	public async extendVideoConference(id: string): Promise<IVideoConferenceExtender> {
		const call = (await bridgeCall(this.senderFn, 'getVideoConferenceBridge', 'doGetById', id, 'APP_ID')) as VideoConference;

		call._updatedAt = new Date();

		return new VideoConferenceExtender(call);
	}

	public async finish(extender: IMessageExtender | IRoomExtender | IVideoConferenceExtender): Promise<void> {
		switch (extender.kind) {
			case RocketChatAssociationModel.MESSAGE:
				await bridgeCall(this.senderFn, 'getMessageBridge', 'doUpdate', (extender as IMessageExtender).getMessage(), 'APP_ID');
				break;
			case RocketChatAssociationModel.ROOM:
				await bridgeCall(
					this.senderFn,
					'getRoomBridge',
					'doUpdate',
					(extender as IRoomExtender).getRoom(),
					(extender as IRoomExtender).getUsernamesOfMembersBeingAdded(),
					'APP_ID',
				);
				break;
			case RocketChatAssociationModel.VIDEO_CONFERENCE:
				await bridgeCall(
					this.senderFn,
					'getVideoConferenceBridge',
					'doUpdate',
					(extender as IVideoConferenceExtender).getVideoConference(),
					'APP_ID',
				);
				break;
			default:
				throw new Error('Invalid extender passed to the ModifyExtender.finish function.');
		}
	}
}
