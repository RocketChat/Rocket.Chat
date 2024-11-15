import type { IRoomExtender } from '../../definition/accessors';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
export declare class RoomExtender implements IRoomExtender {
    private room;
    kind: RocketChatAssociationModel.ROOM;
    private members;
    constructor(room: IRoom);
    addCustomField(key: string, value: any): IRoomExtender;
    addMember(user: IUser): IRoomExtender;
    getMembersBeingAdded(): Array<IUser>;
    getUsernamesOfMembersBeingAdded(): Array<string>;
    getRoom(): IRoom;
}
