import type { IContactCreator } from '@rocket.chat/apps-engine/definition/accessors/IContactCreator.js';
import type { IDiscussionBuilder } from '@rocket.chat/apps-engine/definition/accessors/IDiscussionBuilder.js';
import type { IEmailCreator } from '@rocket.chat/apps-engine/definition/accessors/IEmailCreator.js';
import type { ILivechatCreator } from '@rocket.chat/apps-engine/definition/accessors/ILivechatCreator.js';
import type { ILivechatMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/ILivechatMessageBuilder.js';
import type { IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/IMessageBuilder.js';
import type { IModifyCreator } from '@rocket.chat/apps-engine/definition/accessors/IModifyCreator.js';
import type { IRoomBuilder } from '@rocket.chat/apps-engine/definition/accessors/IRoomBuilder.js';
import type { IUploadCreator } from '@rocket.chat/apps-engine/definition/accessors/IUploadCreator.js';
import type { IUserBuilder } from '@rocket.chat/apps-engine/definition/accessors/IUserBuilder.js';
import type { IVideoConferenceBuilder } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceBuilder.js';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.js';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.js';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType.js';
import type { IBotUser } from '@rocket.chat/apps-engine/definition/users/IBotUser.js';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser.js';
import { UserType } from '@rocket.chat/apps-engine/definition/users/UserType.js';

import { ContactCreator } from './ContactCreator.js';
import { EmailCreator } from './EmailCreator.js';
import { LivechatCreator } from './LivechatCreator.js';
import { UploadCreator } from './UploadCreator.js';
import { AppObjectRegistry } from '../../../AppObjectRegistry.js';
import { UIHelper } from '../../UIHelper.js';
import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';
import { BlockBuilder } from '../builders/BlockBuilder.js';
import { DiscussionBuilder } from '../builders/DiscussionBuilder.js';
import type { ILivechatMessage } from '../builders/LivechatMessageBuilder.js';
import { LivechatMessageBuilder } from '../builders/LivechatMessageBuilder.js';
import { MessageBuilder } from '../builders/MessageBuilder.js';
import { RoomBuilder } from '../builders/RoomBuilder.js';
import { UserBuilder } from '../builders/UserBuilder.js';
import type { AppVideoConference } from '../builders/VideoConferenceBuilder.js';
import { VideoConferenceBuilder } from '../builders/VideoConferenceBuilder.js';

export class ModifyCreator implements IModifyCreator {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	getLivechatCreator(): ILivechatCreator {
		return new LivechatCreator((request) => this.senderFn(request));
	}

	getUploadCreator(): IUploadCreator {
		return new UploadCreator((request) => this.senderFn(request));
	}

	getEmailCreator(): IEmailCreator {
		return new EmailCreator((request) => this.senderFn(request));
	}

	getContactCreator(): IContactCreator {
		return new ContactCreator((request) => this.senderFn(request));
	}

	getBlockBuilder() {
		return new BlockBuilder();
	}

	startMessage(data?: IMessage) {
		if (data) {
			delete data.id;
		}

		return new MessageBuilder(data);
	}

	startLivechatMessage(data?: ILivechatMessage) {
		if (data) {
			delete data.id;
		}

		return new LivechatMessageBuilder(data);
	}

	startRoom(data?: IRoom) {
		if (data) {
			delete data.id;
		}

		return new RoomBuilder(data);
	}

	startDiscussion(data?: Partial<IRoom>) {
		if (data) {
			delete data.id;
		}

		return new DiscussionBuilder(data);
	}

	startVideoConference(data?: Partial<AppVideoConference>) {
		return new VideoConferenceBuilder(data);
	}

	startBotUser(data?: Partial<IBotUser>) {
		if (data) {
			delete data.id;

			const { roles } = data;

			if (roles?.length) {
				const hasRole = roles
					.map((role: string) => role.toLocaleLowerCase())
					.some((role: string) => role === 'admin' || role === 'owner' || role === 'moderator');

				if (hasRole) {
					throw new Error('Invalid role assigned to the user. Should not be admin, owner or moderator.');
				}
			}

			if (!data.type) {
				data.type = UserType.BOT;
			}
		}

		return new UserBuilder(data);
	}

	public finish(
		builder: IMessageBuilder | ILivechatMessageBuilder | IRoomBuilder | IDiscussionBuilder | IVideoConferenceBuilder | IUserBuilder,
	): Promise<string> {
		switch (builder.kind) {
			case RocketChatAssociationModel.MESSAGE:
				return this._finishMessage(builder as IMessageBuilder);
			case RocketChatAssociationModel.LIVECHAT_MESSAGE:
				return this._finishLivechatMessage(builder as ILivechatMessageBuilder);
			case RocketChatAssociationModel.ROOM:
				return this._finishRoom(builder as IRoomBuilder);
			case RocketChatAssociationModel.DISCUSSION:
				return this._finishDiscussion(builder as DiscussionBuilder);
			case RocketChatAssociationModel.VIDEO_CONFERENCE:
				return this._finishVideoConference(builder as IVideoConferenceBuilder);
			case RocketChatAssociationModel.USER:
				return this._finishUser(builder as IUserBuilder);
			default:
				throw new Error('Invalid builder passed to the ModifyCreator.finish function.');
		}
	}

	private async _finishMessage(builder: IMessageBuilder): Promise<string> {
		const result = builder.getMessage();
		delete result.id;

		if (!result.sender?.id) {
			const appUser = await bridgeCall(this.senderFn, 'getUserBridge', 'doGetAppUser', 'APP_ID');

			if (!appUser) {
				throw new Error('Invalid sender assigned to the message.');
			}

			result.sender = appUser as IUser;
		}

		if (result.blocks?.length) {
			// Can we move this elsewhere? This AppObjectRegistry usage doesn't really belong here, but where?
			result.blocks = UIHelper.assignIds(result.blocks, AppObjectRegistry.get('id') || '');
		}

		const createdMessageId = (await bridgeCall(this.senderFn, 'getMessageBridge', 'doCreate', result, 'APP_ID')) as string;

		return String(createdMessageId);
	}

	private async _finishLivechatMessage(builder: ILivechatMessageBuilder): Promise<string> {
		if (builder.getSender() && !builder.getVisitor()) {
			return this._finishMessage(builder.getMessageBuilder());
		}

		const result = builder.getMessage();
		delete result.id;

		if (!result.token && !result.visitor?.token) {
			throw new Error('Invalid visitor sending the message');
		}

		result.token = result.visitor ? result.visitor.token : result.token;

		const createdMessageId = (await bridgeCall(this.senderFn, 'getLivechatBridge', 'doCreateMessage', result, 'APP_ID')) as string;

		return String(createdMessageId);
	}

	private async _finishRoom(builder: IRoomBuilder): Promise<string> {
		const result = builder.getRoom();
		delete result.id;

		if (!result.type) {
			throw new Error('Invalid type assigned to the room.');
		}

		if (result.type !== RoomType.LIVE_CHAT) {
			if (!result.creator?.id) {
				throw new Error('Invalid creator assigned to the room.');
			}
		}

		if (result.type !== RoomType.DIRECT_MESSAGE) {
			if (result.type !== RoomType.LIVE_CHAT) {
				if (!result.slugifiedName?.trim()) {
					throw new Error('Invalid slugifiedName assigned to the room.');
				}
			}

			if (!result.displayName?.trim()) {
				throw new Error('Invalid displayName assigned to the room.');
			}
		}

		const createdRoomId = (await bridgeCall(
			this.senderFn,
			'getRoomBridge',
			'doCreate',
			result,
			builder.getMembersToBeAddedUsernames(),
			'APP_ID',
		)) as string;

		return String(createdRoomId);
	}

	private async _finishDiscussion(builder: DiscussionBuilder): Promise<string> {
		const room = builder.getRoom();

		delete room.id;

		if (!room.creator?.id) {
			throw new Error('Invalid creator assigned to the discussion.');
		}

		if (!room.slugifiedName?.trim()) {
			throw new Error('Invalid slugifiedName assigned to the discussion.');
		}

		if (!room.displayName?.trim()) {
			throw new Error('Invalid displayName assigned to the discussion.');
		}

		if (!room.parentRoom?.id) {
			throw new Error('Invalid parentRoom assigned to the discussion.');
		}

		const createdDiscussionId = (await bridgeCall(
			this.senderFn,
			'getRoomBridge',
			'doCreateDiscussion',
			room,
			builder.getParentMessage(),
			builder.getReply(),
			builder.getMembersToBeAddedUsernames(),
			'APP_ID',
		)) as string;

		return String(createdDiscussionId);
	}

	private async _finishVideoConference(builder: IVideoConferenceBuilder): Promise<string> {
		const videoConference = builder.getVideoConference();

		if (!videoConference.createdBy) {
			throw new Error('Invalid creator assigned to the video conference.');
		}

		if (!videoConference.providerName?.trim()) {
			throw new Error('Invalid provider name assigned to the video conference.');
		}

		if (!videoConference.rid) {
			throw new Error('Invalid roomId assigned to the video conference.');
		}

		const createdCallId = (await bridgeCall(this.senderFn, 'getVideoConferenceBridge', 'doCreate', videoConference, 'APP_ID')) as string;

		return String(createdCallId);
	}

	private async _finishUser(builder: IUserBuilder): Promise<string> {
		const user = builder.getUser();

		const createdUserId = (await bridgeCall(this.senderFn, 'getUserBridge', 'doCreate', user, 'APP_ID')) as string;

		return String(createdUserId);
	}
}
