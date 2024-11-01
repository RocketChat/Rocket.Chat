import type { IRoomExtender } from '@rocket.chat/apps-engine/definition/accessors/IRoomExtender.ts';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.ts';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser.ts';

import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class RoomExtender implements IRoomExtender {
    public kind: _RocketChatAssociationModel.ROOM;

    private members: Array<IUser>;

    constructor(private room: IRoom) {
        this.kind = RocketChatAssociationModel.ROOM;
        this.members = [];
    }

    public addCustomField(key: string, value: unknown): IRoomExtender {
        if (!this.room.customFields) {
            this.room.customFields = {};
        }

        if (this.room.customFields[key]) {
            throw new Error(`The room already contains a custom field by the key: ${key}`);
        }

        if (key.includes('.')) {
            throw new Error(`The given key contains a period, which is not allowed. Key: ${key}`);
        }

        this.room.customFields[key] = value;

        return this;
    }

    public addMember(user: IUser): IRoomExtender {
        if (this.members.find((u) => u.username === user.username)) {
            throw new Error('The user is already in the room.');
        }

        this.members.push(user);

        return this;
    }

    public getMembersBeingAdded(): Array<IUser> {
        return this.members;
    }

    public getUsernamesOfMembersBeingAdded(): Array<string> {
        return this.members.map((u) => u.username);
    }

    public getRoom(): IRoom {
        return structuredClone(this.room);
    }
}
