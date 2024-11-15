import type { IMessageExtender, IModifyExtender, IRoomExtender, IVideoConferenceExtender } from '../../definition/accessors';
import type { IUser } from '../../definition/users';
import type { AppBridges } from '../bridges/AppBridges';
export declare class ModifyExtender implements IModifyExtender {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    extendMessage(messageId: string, updater: IUser): Promise<IMessageExtender>;
    extendRoom(roomId: string, updater: IUser): Promise<IRoomExtender>;
    extendVideoConference(id: string): Promise<IVideoConferenceExtender>;
    finish(extender: IMessageExtender | IRoomExtender | IVideoConferenceExtender): Promise<void>;
}
