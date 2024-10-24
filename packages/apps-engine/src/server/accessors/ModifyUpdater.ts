import type { ILivechatUpdater, IMessageBuilder, IMessageUpdater, IModifyUpdater, IRoomBuilder } from '../../definition/accessors';
import type { IUserUpdater } from '../../definition/accessors/IUserUpdater';
import { RocketChatAssociationModel } from '../../definition/metadata';
import { RoomType } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { AppBridges } from '../bridges';
import { UIHelper } from '../misc/UIHelper';
import { LivechatUpdater } from './LivechatUpdater';
import { MessageBuilder } from './MessageBuilder';
import { RoomBuilder } from './RoomBuilder';
import { UserUpdater } from './UserUpdater';

export class ModifyUpdater implements IModifyUpdater {
    private livechatUpdater: ILivechatUpdater;

    private userUpdater: IUserUpdater;

    private messageUpdater: IMessageUpdater;

    constructor(private readonly bridges: AppBridges, private readonly appId: string) {
        this.livechatUpdater = new LivechatUpdater(this.bridges, this.appId);
        this.userUpdater = new UserUpdater(this.bridges, this.appId);
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

    public async message(messageId: string, updater: IUser): Promise<IMessageBuilder> {
        const msg = await this.bridges.getMessageBridge().doGetById(messageId, this.appId);

        return new MessageBuilder(msg);
    }

    public async room(roomId: string, updater: IUser): Promise<IRoomBuilder> {
        const room = await this.bridges.getRoomBridge().doGetById(roomId, this.appId);

        return new RoomBuilder(room);
    }

    public finish(builder: IMessageBuilder | IRoomBuilder): Promise<void> {
        switch (builder.kind) {
            case RocketChatAssociationModel.MESSAGE:
                return this._finishMessage(builder);
            case RocketChatAssociationModel.ROOM:
                return this._finishRoom(builder);
            default:
                throw new Error('Invalid builder passed to the ModifyUpdater.finish function.');
        }
    }

    private _finishMessage(builder: IMessageBuilder): Promise<void> {
        const result = builder.getMessage();

        if (!result.id) {
            throw new Error("Invalid message, can't update a message without an id.");
        }

        if (!result.sender || !result.sender.id) {
            throw new Error('Invalid sender assigned to the message.');
        }

        if (result.blocks?.length) {
            result.blocks = UIHelper.assignIds(result.blocks, this.appId);
            // result.blocks = this._assignIds(result.blocks);
        }

        return this.bridges.getMessageBridge().doUpdate(result, this.appId);
    }

    private _finishRoom(builder: IRoomBuilder): Promise<void> {
        const result = builder.getRoom();

        if (!result.id) {
            throw new Error('Invalid room, can not update a room without an id.');
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

        return this.bridges.getRoomBridge().doUpdate(result, builder.getMembersToBeAddedUsernames(), this.appId);
    }
}
