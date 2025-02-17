import type { IRoomBuilder } from '../../definition/accessors';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { IRoom, RoomType } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
export declare class RoomBuilder implements IRoomBuilder {
    kind: RocketChatAssociationModel.ROOM | RocketChatAssociationModel.DISCUSSION;
    protected room: IRoom;
    private members;
    constructor(data?: Partial<IRoom>);
    setData(data: Partial<IRoom>): IRoomBuilder;
    setDisplayName(name: string): IRoomBuilder;
    getDisplayName(): string;
    setSlugifiedName(name: string): IRoomBuilder;
    getSlugifiedName(): string;
    setType(type: RoomType): IRoomBuilder;
    getType(): RoomType;
    setCreator(creator: IUser): IRoomBuilder;
    getCreator(): IUser;
    /**
     * @deprecated
     */
    addUsername(username: string): IRoomBuilder;
    /**
     * @deprecated
     */
    setUsernames(usernames: Array<string>): IRoomBuilder;
    /**
     * @deprecated
     */
    getUsernames(): Array<string>;
    addMemberToBeAddedByUsername(username: string): IRoomBuilder;
    setMembersToBeAddedByUsernames(usernames: Array<string>): IRoomBuilder;
    getMembersToBeAddedUsernames(): Array<string>;
    setDefault(isDefault: boolean): IRoomBuilder;
    getIsDefault(): boolean;
    setReadOnly(isReadOnly: boolean): IRoomBuilder;
    getIsReadOnly(): boolean;
    setDisplayingOfSystemMessages(displaySystemMessages: boolean): IRoomBuilder;
    getDisplayingOfSystemMessages(): boolean;
    addCustomField(key: string, value: object): IRoomBuilder;
    setCustomFields(fields: {
        [key: string]: object;
    }): IRoomBuilder;
    getCustomFields(): {
        [key: string]: object;
    };
    getUserIds(): Array<string>;
    getRoom(): IRoom;
}
