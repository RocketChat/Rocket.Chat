import type { IMessageExtender } from '@rocket.chat/apps-engine/definition/accessors/IMessageExtender';
import type { IModifyExtender } from '@rocket.chat/apps-engine/definition/accessors/IModifyExtender';
import type { IRoomExtender } from '@rocket.chat/apps-engine/definition/accessors/IRoomExtender';
import type { IVideoConferenceExtender } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceExtend';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConference';

import { RemoteBridges } from '../../bridges/RemoteBridges';
import type * as Messenger from '../../messenger';
import { MessageExtender } from '../extenders/MessageExtender';
import { RoomExtender } from '../extenders/RoomExtender';
import { VideoConferenceExtender } from '../extenders/VideoConferenceExtend';

export class ModifyExtender implements IModifyExtender {
	private readonly senderFn: typeof Messenger.sendRequest;

	private readonly bridges: RemoteBridges;

	constructor(senderFn: typeof Messenger.sendRequest) {
		this.senderFn = senderFn;
		// The facade reads `this.senderFn` at call time (rather than capturing it) so
		// that tests which swap out `senderFn` after construction remain intercepted.
		this.bridges = new RemoteBridges((request) => this.senderFn(request));
	}

	public async extendMessage(messageId: string, updater: IUser): Promise<IMessageExtender> {
		const msg = (await this.bridges.getMessageBridge().doGetById(messageId, 'APP_ID')) as IMessage;

		msg.editor = updater;
		msg.editedAt = new Date();

		return new MessageExtender(msg);
	}

	public async extendRoom(roomId: string, _updater: IUser): Promise<IRoomExtender> {
		const room = (await this.bridges.getRoomBridge().doGetById(roomId, 'APP_ID')) as IRoom;

		room.updatedAt = new Date();

		return new RoomExtender(room);
	}

	public async extendVideoConference(id: string): Promise<IVideoConferenceExtender> {
		const call = (await this.bridges.getVideoConferenceBridge().doGetById(id, 'APP_ID')) as VideoConference;

		call._updatedAt = new Date();

		return new VideoConferenceExtender(call);
	}

	public async finish(extender: IMessageExtender | IRoomExtender | IVideoConferenceExtender): Promise<void> {
		switch (extender.kind) {
			case RocketChatAssociationModel.MESSAGE:
				await this.bridges.getMessageBridge().doUpdate((extender as IMessageExtender).getMessage(), 'APP_ID');
				break;
			case RocketChatAssociationModel.ROOM:
				await this.bridges
					.getRoomBridge()
					.doUpdate((extender as IRoomExtender).getRoom(), (extender as IRoomExtender).getUsernamesOfMembersBeingAdded(), 'APP_ID');
				break;
			case RocketChatAssociationModel.VIDEO_CONFERENCE:
				await this.bridges.getVideoConferenceBridge().doUpdate((extender as IVideoConferenceExtender).getVideoConference(), 'APP_ID');
				break;
			default:
				throw new Error('Invalid extender passed to the ModifyExtender.finish function.');
		}
	}
}
