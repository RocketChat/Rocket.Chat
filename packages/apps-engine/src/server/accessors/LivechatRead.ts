import type { ILivechatRead } from '../../definition/accessors/ILivechatRead';
import type { IDepartment } from '../../definition/livechat';
import type { ILivechatRoom } from '../../definition/livechat/ILivechatRoom';
import type { IVisitor } from '../../definition/livechat/IVisitor';
import type { IMessage } from '../../definition/messages';
import type { LivechatBridge } from '../bridges/LivechatBridge';

export class LivechatRead implements ILivechatRead {
    constructor(
        private readonly livechatBridge: LivechatBridge,
        private readonly appId: string,
    ) {}

    /**
     * @deprecated please use the `isOnlineAsync` method instead.
     * In the next major, this method will be `async`
     */
    public isOnline(departmentId?: string): boolean {
        console.warn("The `LivechatRead.isOnline` method is deprecated and won't behave as intended. Please use `LivechatRead.isOnlineAsync` instead");

        return this.livechatBridge.doIsOnline(departmentId, this.appId);
    }

    public isOnlineAsync(departmentId?: string): Promise<boolean> {
        return this.livechatBridge.doIsOnlineAsync(departmentId, this.appId);
    }

    public getDepartmentsEnabledWithAgents(): Promise<Array<IDepartment>> {
        return this.livechatBridge.doFindDepartmentsEnabledWithAgents(this.appId);
    }

    public getLivechatRooms(visitor: IVisitor, departmentId?: string): Promise<Array<ILivechatRoom>> {
        return this.livechatBridge.doFindRooms(visitor, departmentId, this.appId);
    }

    public getLivechatTotalOpenRoomsByAgentId(agentId: string): Promise<number> {
        return this.livechatBridge.doCountOpenRoomsByAgentId(agentId, this.appId);
    }

    public getLivechatOpenRoomsByAgentId(agentId: string): Promise<Array<ILivechatRoom>> {
        return this.livechatBridge.doFindOpenRoomsByAgentId(agentId, this.appId);
    }

    /**
     * @deprecated This method does not adhere to the conversion practices applied
     * elsewhere in the Apps-Engine and will be removed in the next major version.
     * Prefer the alternative methods to fetch visitors.
     */
    public getLivechatVisitors(query: object): Promise<Array<IVisitor>> {
        return this.livechatBridge.doFindVisitors(query, this.appId);
    }

    public getLivechatVisitorById(id: string): Promise<IVisitor | undefined> {
        return this.livechatBridge.doFindVisitorById(id, this.appId);
    }

    public getLivechatVisitorByEmail(email: string): Promise<IVisitor | undefined> {
        return this.livechatBridge.doFindVisitorByEmail(email, this.appId);
    }

    public getLivechatVisitorByToken(token: string): Promise<IVisitor | undefined> {
        return this.livechatBridge.doFindVisitorByToken(token, this.appId);
    }

    public getLivechatVisitorByPhoneNumber(phoneNumber: string): Promise<IVisitor | undefined> {
        return this.livechatBridge.doFindVisitorByPhoneNumber(phoneNumber, this.appId);
    }

    public getLivechatDepartmentByIdOrName(value: string): Promise<IDepartment | undefined> {
        return this.livechatBridge.doFindDepartmentByIdOrName(value, this.appId);
    }

    public _fetchLivechatRoomMessages(roomId: string): Promise<Array<IMessage>> {
        return this.livechatBridge.do_fetchLivechatRoomMessages(this.appId, roomId);
    }
}
