import { randomBytes } from 'crypto';

import type { ILivechatCreator } from '../../definition/accessors';
import type { IExtraRoomParams } from '../../definition/accessors/ILivechatCreator';
import type { ILivechatRoom } from '../../definition/livechat/ILivechatRoom';
import type { IVisitor } from '../../definition/livechat/IVisitor';
import type { IUser } from '../../definition/users';
import type { AppBridges } from '../bridges';

export class LivechatCreator implements ILivechatCreator {
    constructor(
        private readonly bridges: AppBridges,
        private readonly appId: string,
    ) {}

    public createRoom(visitor: IVisitor, agent: IUser, extraParams?: IExtraRoomParams): Promise<ILivechatRoom> {
        return this.bridges.getLivechatBridge().doCreateRoom(visitor, agent, this.appId, extraParams);
    }

    /**
     * @deprecated Use `createAndReturnVisitor` instead.
     */
    public createVisitor(visitor: IVisitor): Promise<string> {
        return this.bridges.getLivechatBridge().doCreateVisitor(visitor, this.appId);
    }

    public createAndReturnVisitor(visitor: IVisitor): Promise<IVisitor | undefined> {
        return this.bridges.getLivechatBridge().doCreateAndReturnVisitor(visitor, this.appId);
    }

    public createToken(): string {
        return randomBytes(16).toString('hex'); // Ensures 128 bits of entropy
    }
}
