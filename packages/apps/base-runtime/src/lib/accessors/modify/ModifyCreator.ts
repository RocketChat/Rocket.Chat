import { randomBytes } from 'node:crypto';

import { UIHelper } from '@rocket.chat/apps/dist/server/misc/UIHelper';
import type { IContactCreator } from '@rocket.chat/apps-engine/definition/accessors/IContactCreator';
import type { IDiscussionBuilder } from '@rocket.chat/apps-engine/definition/accessors/IDiscussionBuilder';
import type { IEmailCreator } from '@rocket.chat/apps-engine/definition/accessors/IEmailCreator';
import type { ILivechatCreator } from '@rocket.chat/apps-engine/definition/accessors/ILivechatCreator';
import type { ILivechatMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/ILivechatMessageBuilder';
import type { IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/IMessageBuilder';
import type { IModifyCreator } from '@rocket.chat/apps-engine/definition/accessors/IModifyCreator';
import type { IRoomBuilder } from '@rocket.chat/apps-engine/definition/accessors/IRoomBuilder';
import type { IUploadCreator } from '@rocket.chat/apps-engine/definition/accessors/IUploadCreator';
import type { IUserBuilder } from '@rocket.chat/apps-engine/definition/accessors/IUserBuilder';
import type { IVideoConferenceBuilder } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceBuilder';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType';
import type { IBotUser } from '@rocket.chat/apps-engine/definition/users/IBotUser';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';
import { UserType } from '@rocket.chat/apps-engine/definition/users/UserType';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import type * as Messenger from '../../messenger';
import { BlockBuilder } from '../builders/BlockBuilder';
import { DiscussionBuilder } from '../builders/DiscussionBuilder';
import type { ILivechatMessage } from '../builders/LivechatMessageBuilder';
import { LivechatMessageBuilder } from '../builders/LivechatMessageBuilder';
import { MessageBuilder } from '../builders/MessageBuilder';
import { RoomBuilder } from '../builders/RoomBuilder';
import { UserBuilder } from '../builders/UserBuilder';
import type { AppVideoConference } from '../builders/VideoConferenceBuilder';
import { VideoConferenceBuilder } from '../builders/VideoConferenceBuilder';
import { formatErrorResponse } from '../formatResponseErrorHandler';

export class ModifyCreator implements IModifyCreator {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	getLivechatCreator(): ILivechatCreator {
		return new Proxy(
			{ __kind: 'getLivechatCreator' },
			{
				get: (_target: unknown, prop: string) => {
					// It's not worthwhile to make an asynchronous request for such a simple method
					if (prop === 'createToken') {
						return () => randomBytes(16).toString('hex');
					}

					if (prop === 'toJSON') {
						return () => ({});
					}

					return (...params: unknown[]) =>
						this.senderFn({
							method: `accessor:getModifier:getCreator:getLivechatCreator:${prop}`,
							params,
						})
							.then((response) => response.result)
							.catch((err) => {
								throw formatErrorResponse(err);
							});
				},
			},
		) as ILivechatCreator;
	}

	getUploadCreator(): IUploadCreator {
		return new Proxy(
			{ __kind: 'getUploadCreator' },
			{
				get:
					(_target: unknown, prop: string) =>
					(...params: unknown[]) =>
						prop === 'toJSON'
							? {}
							: this.senderFn({
									method: `accessor:getModifier:getCreator:getUploadCreator:${prop}`,
									params,
								})
									.then((response) => response.result)
									.catch((err) => {
										throw formatErrorResponse(err);
									}),
			},
		) as IUploadCreator;
	}

	getEmailCreator(): IEmailCreator {
		return new Proxy(
			{ __kind: 'getEmailCreator' },
			{
				get:
					(_target: unknown, prop: string) =>
					(...params: unknown[]) =>
						prop === 'toJSON'
							? {}
							: this.senderFn({
									method: `accessor:getModifier:getCreator:getEmailCreator:${prop}`,
									params,
								})
									.then((response) => response.result)
									.catch((err) => {
										throw formatErrorResponse(err);
									}),
			},
		) as IEmailCreator;
	}

	getContactCreator(): IContactCreator {
		return new Proxy(
			{ __kind: 'getContactCreator' },
			{
				get:
					(_target: unknown, prop: string) =>
					(...params: unknown[]) =>
						prop === 'toJSON'
							? {}
							: this.senderFn({
									method: `accessor:getModifier:getCreator:getContactCreator:${prop}`,
									params,
								})
									.then((response) => response.result)
									.catch((err) => {
										throw formatErrorResponse(err);
									}),
			},
		) as IContactCreator;
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
			// @ts-ignore - this has been imported from the Apps-Engine
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
			const response = await this.senderFn({
				method: 'bridges:getUserBridge:doGetAppUser',
				params: ['APP_ID'],
			}).catch((err) => {
				throw formatErrorResponse(err);
			});

			const appUser = response.result;

			if (!appUser) {
				throw new Error('Invalid sender assigned to the message.');
			}

			result.sender = appUser as IUser;
		}

		if (result.blocks?.length) {
			// Can we move this elsewhere? This AppObjectRegistry usage doesn't really belong here, but where?
			result.blocks = UIHelper.assignIds(result.blocks, AppObjectRegistry.get('id') || '');
		}

		const response = await this.senderFn({
			method: 'bridges:getMessageBridge:doCreate',
			params: [result, AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});

		return String(response.result);
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

		const response = await this.senderFn({
			method: 'bridges:getLivechatBridge:doCreateMessage',
			params: [result, AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});

		return String(response.result);
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

		const response = await this.senderFn({
			method: 'bridges:getRoomBridge:doCreate',
			params: [result, builder.getMembersToBeAddedUsernames(), AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});

		return String(response.result);
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

		const response = await this.senderFn({
			method: 'bridges:getRoomBridge:doCreateDiscussion',
			params: [room, builder.getParentMessage(), builder.getReply(), builder.getMembersToBeAddedUsernames(), AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});

		return String(response.result);
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

		const response = await this.senderFn({
			method: 'bridges:getVideoConferenceBridge:doCreate',
			params: [videoConference, AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});

		return String(response.result);
	}

	private async _finishUser(builder: IUserBuilder): Promise<string> {
		const user = builder.getUser();

		const response = await this.senderFn({
			method: 'bridges:getUserBridge:doCreate',
			params: [user, AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});

		return String(response.result);
	}
}
