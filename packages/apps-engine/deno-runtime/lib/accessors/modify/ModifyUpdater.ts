import type { IModifyUpdater } from '@rocket.chat/apps-engine/definition/accessors/IModifyUpdater.ts';
import type { ILivechatUpdater } from '@rocket.chat/apps-engine/definition/accessors/ILivechatUpdater.ts';
import type { IUserUpdater } from '@rocket.chat/apps-engine/definition/accessors/IUserUpdater.ts';
import type { IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/IMessageBuilder.ts';
import type { IRoomBuilder } from '@rocket.chat/apps-engine/definition/accessors/IRoomBuilder.ts';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser.ts';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.ts';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.ts';

import type { UIHelper as _UIHelper } from '@rocket.chat/apps-engine/server/misc/UIHelper.ts';
import type { RoomType as _RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType.ts';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';

import * as Messenger from '../../messenger.ts';

import { MessageBuilder } from '../builders/MessageBuilder.ts';
import { RoomBuilder } from '../builders/RoomBuilder.ts';
import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';

import { require } from '../../../lib/require.ts';

const { UIHelper } = require('@rocket.chat/apps-engine/server/misc/UIHelper.js') as { UIHelper: typeof _UIHelper };
const { RoomType } = require('@rocket.chat/apps-engine/definition/rooms/RoomType.js') as { RoomType: typeof _RoomType };
const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class ModifyUpdater implements IModifyUpdater {
    constructor(private readonly senderFn: typeof Messenger.sendRequest) { }

    public getLivechatUpdater(): ILivechatUpdater {
        return new Proxy(
            { __kind: 'getLivechatUpdater' },
            {
                get:
                    (_target: unknown, prop: string) =>
                        (...params: unknown[]) =>
                            prop === 'toJSON'
                                ? {}
                                : this.senderFn({
                                    method: `accessor:getModifier:getUpdater:getLivechatUpdater:${prop}`,
                                    params,
                                })
                                    .then((response) => response.result)
                                    .catch((err) => {
                                        throw new Error(err.error);
                                    }),
            },
        ) as ILivechatUpdater;
    }

    public getUserUpdater(): IUserUpdater {
        return new Proxy(
            { __kind: 'getUserUpdater' },
            {
                get:
                    (_target: unknown, prop: string) =>
                        (...params: unknown[]) =>
                            prop === 'toJSON'
                                ? {}
                                : this.senderFn({
                                    method: `accessor:getModifier:getUpdater:getUserUpdater:${prop}`,
                                    params,
                                })
                                    .then((response) => response.result)
                                    .catch((err) => {
                                        throw new Error(err.error);
                                    }),
            },
        ) as IUserUpdater;
    }

    public async message(messageId: string, _updater: IUser): Promise<IMessageBuilder> {
        const response = await this.senderFn({
            method: 'bridges:getMessageBridge:doGetById',
            params: [messageId, AppObjectRegistry.get('id')],
        });

        return new MessageBuilder(response.result as IMessage);
    }

    public async room(roomId: string, _updater: IUser): Promise<IRoomBuilder> {
        const response = await this.senderFn({
            method: 'bridges:getRoomBridge:doGetById',
            params: [roomId, AppObjectRegistry.get('id')],
        });

        return new RoomBuilder(response.result as IRoom);
    }

    public finish(builder: IMessageBuilder | IRoomBuilder): Promise<void> {
        switch (builder.kind) {
            case RocketChatAssociationModel.MESSAGE:
                return this._finishMessage(builder as IMessageBuilder);
            case RocketChatAssociationModel.ROOM:
                return this._finishRoom(builder as IRoomBuilder);
            default:
                throw new Error('Invalid builder passed to the ModifyUpdater.finish function.');
        }
    }

    private async _finishMessage(builder: IMessageBuilder): Promise<void> {
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

        await this.senderFn({
            method: 'bridges:getMessageBridge:doUpdate',
            params: [result, AppObjectRegistry.get('id')],
        });
    }

    private async _finishRoom(builder: IRoomBuilder): Promise<void> {
        const result = builder.getRoom();

        if (!result.id) {
            throw new Error("Invalid room, can't update a room without an id.");
        }

        if (!result.type) {
            throw new Error('Invalid type assigned to the room.');
        }

        if (result.type !== RoomType.LIVE_CHAT) {
            if (!result.creator || !result.creator.id) {
                throw new Error('Invalid creator assigned to the room.');
            }

            if (!result.slugifiedName || !result.slugifiedName.trim()) {
                throw new Error('Invalid slugifiedName assigned to the room.');
            }
        }

        if (!result.displayName || !result.displayName.trim()) {
            throw new Error('Invalid displayName assigned to the room.');
        }

        await this.senderFn({
            method: 'bridges:getRoomBridge:doUpdate',
            params: [result, builder.getMembersToBeAddedUsernames(), AppObjectRegistry.get('id')],
        });
    }
}
