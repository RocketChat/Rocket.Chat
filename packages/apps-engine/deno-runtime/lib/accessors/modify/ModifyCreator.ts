import type { IModifyCreator } from '@rocket.chat/apps-engine/definition/accessors/IModifyCreator.ts';
import type { IUploadCreator } from '@rocket.chat/apps-engine/definition/accessors/IUploadCreator.ts';
import type { IEmailCreator } from '@rocket.chat/apps-engine/definition/accessors/IEmailCreator.ts';
import type { IContactCreator } from '@rocket.chat/apps-engine/definition/accessors/IContactCreator.ts';
import type { ILivechatCreator } from '@rocket.chat/apps-engine/definition/accessors/ILivechatCreator.ts';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.ts';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.ts';
import type { IBotUser } from '@rocket.chat/apps-engine/definition/users/IBotUser.ts';
import type { UserType as _UserType } from '@rocket.chat/apps-engine/definition/users/UserType.ts';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';
import type { IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/IMessageBuilder.ts';
import type { IRoomBuilder } from '@rocket.chat/apps-engine/definition/accessors/IRoomBuilder.ts';
import type { IUserBuilder } from '@rocket.chat/apps-engine/definition/accessors/IUserBuilder.ts';
import type { IVideoConferenceBuilder } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceBuilder.ts';
import type { RoomType as _RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType.ts';
import type { ILivechatMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/ILivechatMessageBuilder.ts';
import type { UIHelper as _UIHelper } from '@rocket.chat/apps-engine/server/misc/UIHelper.ts';

import * as Messenger from '../../messenger.ts';
import { randomBytes } from 'node:crypto';

import { BlockBuilder } from '../builders/BlockBuilder.ts';
import { MessageBuilder } from '../builders/MessageBuilder.ts';
import { DiscussionBuilder, IDiscussionBuilder } from '../builders/DiscussionBuilder.ts';
import { ILivechatMessage, LivechatMessageBuilder } from '../builders/LivechatMessageBuilder.ts';
import { RoomBuilder } from '../builders/RoomBuilder.ts';
import { UserBuilder } from '../builders/UserBuilder.ts';
import { AppVideoConference, VideoConferenceBuilder } from '../builders/VideoConferenceBuilder.ts';
import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';
import { require } from '../../../lib/require.ts';

const { UIHelper } = require('@rocket.chat/apps-engine/server/misc/UIHelper.js') as { UIHelper: typeof _UIHelper };
const { RoomType } = require('@rocket.chat/apps-engine/definition/rooms/RoomType.js') as { RoomType: typeof _RoomType };
const { UserType } = require('@rocket.chat/apps-engine/definition/users/UserType.js') as { UserType: typeof _UserType };
const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class ModifyCreator implements IModifyCreator {
    constructor(private readonly senderFn: typeof Messenger.sendRequest) { }

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
                                if (err instanceof Error) {
                                    throw err;
                                }
                                if (err?.error?.message) {
                                    throw new Error(err.error.message);
                                }
                                throw new Error(err.error);
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
                                        if (err instanceof Error) {
                                            throw err;
                                        }
                                        if (err?.error?.message) {
                                            throw new Error(err.error.message);
                                        }
                                        throw new Error(err.error);
                                    }),
            },
        ) as IUploadCreator;
    }

    getEmailCreator(): IEmailCreator {
        return new Proxy(
            { __kind: 'getEmailCreator' },
            {
                get: (_target: unknown, prop: string) =>
                        (...params: unknown[]) =>
                            prop === 'toJSON'
                                ? {}
                                : this.senderFn({
                                    method: `accessor:getModifier:getCreator:getEmailCreator:${prop}`,
                                    params
                                })
                                    .then((response) => response.result)
                                    .catch((err) => {
                                        if (err instanceof Error) {
                                            throw err;
                                        }
                                        if (err?.error?.message) {
                                            throw new Error(err.error.message);
                                        }
                                        throw new Error(err.error);
                                    }),
            }
        )
    }

    getContactCreator(): IContactCreator {
        return new Proxy(
            { __kind: 'getContactCreator' },
            {
                get: (_target: unknown, prop: string) =>
                        (...params: unknown[]) =>
                            prop === 'toJSON'
                                ? {}
                                : this.senderFn({
                                    method: `accessor:getModifier:getCreator:getContactCreator:${prop}`,
                                    params
                                })
                                    .then((response) => response.result)
                                    .catch((err) => {
                                        if (err instanceof Error) {
                                            throw err;
                                        }
                                        if (err?.error?.message) {
                                            throw new Error(err.error.message);
                                        }
                                        throw new Error(err.error);
                                    }),
            }
        )
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
                return this._finishDiscussion(builder as IDiscussionBuilder);
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

        if (!result.sender || !result.sender.id) {
            const response = await this.senderFn({
                method: 'bridges:getUserBridge:doGetAppUser',
                params: ['APP_ID'],
            });

            const appUser = response.result;

            if (!appUser) {
                throw new Error('Invalid sender assigned to the message.');
            }

            result.sender = appUser;
        }

        if (result.blocks?.length) {
            // Can we move this elsewhere? This AppObjectRegistry usage doesn't really belong here, but where?
            result.blocks = UIHelper.assignIds(result.blocks, AppObjectRegistry.get('id') || '');
        }

        const response = await this.senderFn({
            method: 'bridges:getMessageBridge:doCreate',
            params: [result, AppObjectRegistry.get('id')],
        });

        return String(response.result);
    }

    private async _finishLivechatMessage(builder: ILivechatMessageBuilder): Promise<string> {
        if (builder.getSender() && !builder.getVisitor()) {
            return this._finishMessage(builder.getMessageBuilder());
        }

        const result = builder.getMessage();
        delete result.id;

        if (!result.token && (!result.visitor || !result.visitor.token)) {
            throw new Error('Invalid visitor sending the message');
        }

        result.token = result.visitor ? result.visitor.token : result.token;

        const response = await this.senderFn({
            method: 'bridges:getLivechatBridge:doCreateMessage',
            params: [result, AppObjectRegistry.get('id')],
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
            if (!result.creator || !result.creator.id) {
                throw new Error('Invalid creator assigned to the room.');
            }
        }

        if (result.type !== RoomType.DIRECT_MESSAGE) {
            if (result.type !== RoomType.LIVE_CHAT) {
                if (!result.slugifiedName || !result.slugifiedName.trim()) {
                    throw new Error('Invalid slugifiedName assigned to the room.');
                }
            }

            if (!result.displayName || !result.displayName.trim()) {
                throw new Error('Invalid displayName assigned to the room.');
            }
        }

        const response = await this.senderFn({
            method: 'bridges:getRoomBridge:doCreate',
            params: [result, builder.getMembersToBeAddedUsernames(), AppObjectRegistry.get('id')],
        });

        return String(response.result);
    }

    private async _finishDiscussion(builder: IDiscussionBuilder): Promise<string> {
        const room = builder.getRoom();
        delete room.id;

        if (!room.creator || !room.creator.id) {
            throw new Error('Invalid creator assigned to the discussion.');
        }

        if (!room.slugifiedName || !room.slugifiedName.trim()) {
            throw new Error('Invalid slugifiedName assigned to the discussion.');
        }

        if (!room.displayName || !room.displayName.trim()) {
            throw new Error('Invalid displayName assigned to the discussion.');
        }

        if (!room.parentRoom || !room.parentRoom.id) {
            throw new Error('Invalid parentRoom assigned to the discussion.');
        }

        const response = await this.senderFn({
            method: 'bridges:getRoomBridge:doCreateDiscussion',
            params: [room, builder.getParentMessage(), builder.getReply(), builder.getMembersToBeAddedUsernames(), AppObjectRegistry.get('id')],
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
        });

        return String(response.result);
    }

    private async _finishUser(builder: IUserBuilder): Promise<string> {
        const user = builder.getUser();

        const response = await this.senderFn({
            method: 'bridges:getUserBridge:doCreate',
            params: [user, AppObjectRegistry.get('id')],
        });

        return String(response.result);
    }
}
