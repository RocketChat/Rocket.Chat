import type { IModifyExtender } from '@rocket.chat/apps-engine/definition/accessors/IModifyExtender.ts';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.ts';
import type { IMessageExtender } from '@rocket.chat/apps-engine/definition/accessors/IMessageExtender.ts';
import type { IRoomExtender } from '@rocket.chat/apps-engine/definition/accessors/IRoomExtender.ts';
import type { IVideoConferenceExtender } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceExtend.ts';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser.ts';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConference.ts';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.ts';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';

import * as Messenger from '../../messenger.ts';
import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';
import { MessageExtender } from '../extenders/MessageExtender.ts';
import { RoomExtender } from '../extenders/RoomExtender.ts';
import { VideoConferenceExtender } from '../extenders/VideoConferenceExtend.ts';
import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class ModifyExtender implements IModifyExtender {
    constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

    public async extendMessage(messageId: string, updater: IUser): Promise<IMessageExtender> {
        const result = await this.senderFn({
            method: 'bridges:getMessageBridge:doGetById',
            params: [messageId, AppObjectRegistry.get('id')],
        });

        const msg = result.result as IMessage;

        msg.editor = updater;
        msg.editedAt = new Date();

        return new MessageExtender(msg);
    }

    public async extendRoom(roomId: string, _updater: IUser): Promise<IRoomExtender> {
        const result = await this.senderFn({
            method: 'bridges:getRoomBridge:doGetById',
            params: [roomId, AppObjectRegistry.get('id')],
        });

        const room = result.result as IRoom;

        room.updatedAt = new Date();

        return new RoomExtender(room);
    }

    public async extendVideoConference(id: string): Promise<IVideoConferenceExtender> {
        const result = await this.senderFn({
            method: 'bridges:getVideoConferenceBridge:doGetById',
            params: [id, AppObjectRegistry.get('id')],
        });

        const call = result.result as VideoConference;

        call._updatedAt = new Date();

        return new VideoConferenceExtender(call);
    }

    public async finish(extender: IMessageExtender | IRoomExtender | IVideoConferenceExtender): Promise<void> {
        switch (extender.kind) {
            case RocketChatAssociationModel.MESSAGE:
                await this.senderFn({
                    method: 'bridges:getMessageBridge:doUpdate',
                    params: [(extender as IMessageExtender).getMessage(), AppObjectRegistry.get('id')],
                });
                break;
            case RocketChatAssociationModel.ROOM:
                await this.senderFn({
                    method: 'bridges:getRoomBridge:doUpdate',
                    params: [
                        (extender as IRoomExtender).getRoom(),
                        (extender as IRoomExtender).getUsernamesOfMembersBeingAdded(),
                        AppObjectRegistry.get('id'),
                    ],
                });
                break;
            case RocketChatAssociationModel.VIDEO_CONFERENCE:
                await this.senderFn({
                    method: 'bridges:getVideoConferenceBridge:doUpdate',
                    params: [(extender as IVideoConferenceExtender).getVideoConference(), AppObjectRegistry.get('id')],
                });
                break;
            default:
                throw new Error('Invalid extender passed to the ModifyExtender.finish function.');
        }
    }
}
