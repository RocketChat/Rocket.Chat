import type { ILivechatUpdater } from '../../definition/accessors';
import type { ILivechatRoom, ILivechatTransferData, IVisitor } from '../../definition/livechat';
import type { IUser } from '../../definition/users';
import type { AppBridges } from '../bridges';
export declare class LivechatUpdater implements ILivechatUpdater {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    transferVisitor(visitor: IVisitor, transferData: ILivechatTransferData): Promise<boolean>;
    closeRoom(room: ILivechatRoom, comment: string, closer?: IUser): Promise<boolean>;
    setCustomFields(token: IVisitor['token'], key: string, value: string, overwrite: boolean): Promise<boolean>;
}
