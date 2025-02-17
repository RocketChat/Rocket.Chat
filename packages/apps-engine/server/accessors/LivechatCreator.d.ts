import type { ILivechatCreator } from '../../definition/accessors';
import type { IExtraRoomParams } from '../../definition/accessors/ILivechatCreator';
import type { ILivechatRoom } from '../../definition/livechat/ILivechatRoom';
import type { IVisitor } from '../../definition/livechat/IVisitor';
import type { IUser } from '../../definition/users';
import type { AppBridges } from '../bridges';
export declare class LivechatCreator implements ILivechatCreator {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    createRoom(visitor: IVisitor, agent: IUser, extraParams?: IExtraRoomParams): Promise<ILivechatRoom>;
    /**
     * @deprecated Use `createAndReturnVisitor` instead.
     */
    createVisitor(visitor: IVisitor): Promise<string>;
    createAndReturnVisitor(visitor: IVisitor): Promise<IVisitor | undefined>;
    createToken(): string;
}
