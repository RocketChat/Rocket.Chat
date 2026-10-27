import type { IMessageExtender } from '@rocket.chat/apps-engine/definition/accessors/IMessageExtender';
import type { IModifyExtender } from '@rocket.chat/apps-engine/definition/accessors/IModifyExtender';
import type { IRoomExtender } from '@rocket.chat/apps-engine/definition/accessors/IRoomExtender';
import type { IVideoConferenceExtender } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceExtend';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConference';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';
import { MessageExtender } from '../extenders/MessageExtender';
import { RoomExtender } from '../extenders/RoomExtender';
import { VideoConferenceExtender } from '../extenders/VideoConferenceExtend';

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
