import { UIHelper } from '@rocket.chat/apps/dist/server/misc/UIHelper';
import type { IModifyUpdater } from '@rocket.chat/apps-engine/definition/accessors/IModifyUpdater';
import type { ILivechatUpdater } from '@rocket.chat/apps-engine/definition/accessors/ILivechatUpdater';
import type { IUserUpdater } from '@rocket.chat/apps-engine/definition/accessors/IUserUpdater';
import type { IMessageUpdater } from '@rocket.chat/apps-engine/definition/accessors/IMessageUpdater';
import type { IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/IMessageBuilder';
import type { IRoomBuilder } from '@rocket.chat/apps-engine/definition/accessors/IRoomBuilder';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';

import type { RoomType as _RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';

import * as Messenger from '../../messenger.ts';

import { MessageBuilder } from '../builders/MessageBuilder.ts';
import { RoomBuilder } from '../builders/RoomBuilder.ts';
import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';

import { require } from '../../../lib/require.ts';
import { formatErrorResponse } from '../formatResponseErrorHandler.ts';

const { RoomType } = require('@rocket.chat/apps-engine/definition/rooms/RoomType.js') as { RoomType: typeof _RoomType };
const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
	RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class ModifyUpdater implements IModifyUpdater {
	private readonly livechatUpdater: ILivechatUpdater;
	private readonly userUpdater: IUserUpdater;
	private readonly messageUpdater: IMessageUpdater;

	constructor(private readonly senderFn: typeof Messenger.sendRequest) {
		this.livechatUpdater = this.proxify('getLivechatUpdater');
		this.userUpdater = this.proxify('getUserUpdater');
		this.messageUpdater = this.proxify('getMessageUpdater');
	}

	private proxify<T extends ILivechatUpdater | IUserUpdater | IMessageUpdater>(target: 'getLivechatUpdater' | 'getUserUpdater' | 'getMessageUpdater'): T {
		return new Proxy(
			{ __kind: target },
			{
				get:
					(_target: unknown, prop: string) =>
					(...params: unknown[]) =>
						prop === 'toJSON'
							? {}
							: this.senderFn({
									method: `accessor:getModifier:getUpdater:${target}:${prop}`,
									params,
								})
									.then((response) => response.result)
									.catch((err) => {
										throw formatErrorResponse(err);
									}),
			},
		) as T;
	}

	public getLivechatUpdater(): ILivechatUpdater {
		return this.livechatUpdater;
	}

	public getUserUpdater(): IUserUpdater {
		return this.userUpdater;
	}

	public getMessageUpdater(): IMessageUpdater {
		return this.messageUpdater;
	}

	public async message(messageId: string, editor: IUser): Promise<IMessageBuilder> {
		const response = await this.senderFn({
			method: 'bridges:getMessageBridge:doGetById',
			params: [messageId, AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});

		const builder = new MessageBuilder(response.result as IMessage);

		builder.setEditor(editor);

		return builder;
	}

	public async room(roomId: string, _updater: IUser): Promise<IRoomBuilder> {
		const response = await this.senderFn({
			method: 'bridges:getRoomBridge:doGetById',
			params: [roomId, AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});

		return new RoomBuilder(response.result as IRoom);
	}

	public finish(builder: IMessageBuilder | IRoomBuilder): Promise<void> {
		switch (builder.kind) {
			case RocketChatAssociationModel.MESSAGE:
				return this._finishMessage(builder as MessageBuilder);
			case RocketChatAssociationModel.ROOM:
				return this._finishRoom(builder as RoomBuilder);
			default:
				throw new Error('Invalid builder passed to the ModifyUpdater.finish function.');
		}
	}

	private async _finishMessage(builder: MessageBuilder): Promise<void> {
		const result = builder.getMessage();

		if (!result.id) {
			throw new Error("Invalid message, can't update a message without an id.");
		}

		if (!result.sender?.id) {
			throw new Error('Invalid sender assigned to the message.');
		}

		if (result.blocks?.length) {
			result.blocks = UIHelper.assignIds(result.blocks, AppObjectRegistry.get('id') || '');
		}

		const changes = { id: result.id, ...builder.getChanges() };

		await this.senderFn({
			method: 'bridges:getMessageBridge:doUpdate',
			params: [changes, AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});
	}

	private async _finishRoom(builder: RoomBuilder): Promise<void> {
		const room = builder.getRoom();

		if (!room.id) {
			throw new Error("Invalid room, can't update a room without an id.");
		}

		if (!room.type) {
			throw new Error('Invalid type assigned to the room.');
		}

		if (room.type !== RoomType.LIVE_CHAT) {
			if (!room.creator || !room.creator.id) {
				throw new Error('Invalid creator assigned to the room.');
			}

			if (!room.slugifiedName || !room.slugifiedName.trim()) {
				throw new Error('Invalid slugifiedName assigned to the room.');
			}
		}

		if (!room.displayName || !room.displayName.trim()) {
			throw new Error('Invalid displayName assigned to the room.');
		}

		const changes = { id: room.id, ...builder.getChanges() };

		await this.senderFn({
			method: 'bridges:getRoomBridge:doUpdate',
			params: [changes, builder.getMembersToBeAddedUsernames(), AppObjectRegistry.get('id')],
		}).catch((err) => {
			throw formatErrorResponse(err);
		});
	}
}
