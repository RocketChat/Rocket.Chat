import type { IMessageExtender, IModifyExtender, IRoomExtender, IVideoConferenceExtender } from '../../definition/accessors';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { IUser } from '../../definition/users';
import type { AppBridges } from '../bridges/AppBridges';
import { MessageExtender } from './MessageExtender';
import { RoomExtender } from './RoomExtender';
import { VideoConferenceExtender } from './VideoConferenceExtend';

export class ModifyExtender implements IModifyExtender {
    constructor(private readonly bridges: AppBridges, private readonly appId: string) {}

    public async extendMessage(messageId: string, updater: IUser): Promise<IMessageExtender> {
        const msg = await this.bridges.getMessageBridge().doGetById(messageId, this.appId);
        msg.editor = updater;
        msg.editedAt = new Date();

        return new MessageExtender(msg);
    }

    public async extendRoom(roomId: string, updater: IUser): Promise<IRoomExtender> {
        const room = await this.bridges.getRoomBridge().doGetById(roomId, this.appId);
        room.updatedAt = new Date();

        return new RoomExtender(room);
    }

    public async extendVideoConference(id: string): Promise<IVideoConferenceExtender> {
        const call = await this.bridges.getVideoConferenceBridge().doGetById(id, this.appId);
        call._updatedAt = new Date();

        return new VideoConferenceExtender(call);
    }

    public finish(extender: IMessageExtender | IRoomExtender | IVideoConferenceExtender): Promise<void> {
        switch (extender.kind) {
            case RocketChatAssociationModel.MESSAGE:
                return this.bridges.getMessageBridge().doUpdate(extender.getMessage(), this.appId);
            case RocketChatAssociationModel.ROOM:
                return this.bridges.getRoomBridge().doUpdate(extender.getRoom(), extender.getUsernamesOfMembersBeingAdded(), this.appId);
            case RocketChatAssociationModel.VIDEO_CONFERENCE:
                return this.bridges.getVideoConferenceBridge().doUpdate(extender.getVideoConference(), this.appId);
            default:
                throw new Error('Invalid extender passed to the ModifyExtender.finish function.');
        }
    }
}
