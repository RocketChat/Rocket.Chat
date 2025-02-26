import type { ILivechatUpdater } from '../../definition/accessors';
import type { ILivechatRoom, ILivechatTransferData, IVisitor } from '../../definition/livechat';
import type { IUser } from '../../definition/users';
import type { AppBridges } from '../bridges';

export class LivechatUpdater implements ILivechatUpdater {
    constructor(
        private readonly bridges: AppBridges,
        private readonly appId: string,
    ) {}

    public transferVisitor(visitor: IVisitor, transferData: ILivechatTransferData): Promise<boolean> {
        return this.bridges.getLivechatBridge().doTransferVisitor(visitor, transferData, this.appId);
    }

    public closeRoom(room: ILivechatRoom, comment: string, closer?: IUser): Promise<boolean> {
        return this.bridges.getLivechatBridge().doCloseRoom(room, comment, closer, this.appId);
    }

    public setCustomFields(token: IVisitor['token'], key: string, value: string, overwrite: boolean): Promise<boolean> {
        return this.bridges
            .getLivechatBridge()
            .doSetCustomFields({ token, key, value, overwrite }, this.appId)
            .then((result) => result > 0);
    }
}
