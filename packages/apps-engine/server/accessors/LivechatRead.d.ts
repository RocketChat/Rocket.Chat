import type { ILivechatRead } from '../../definition/accessors/ILivechatRead';
import type { IDepartment } from '../../definition/livechat';
import type { ILivechatRoom } from '../../definition/livechat/ILivechatRoom';
import type { IVisitor } from '../../definition/livechat/IVisitor';
import type { IMessage } from '../../definition/messages';
import type { LivechatBridge } from '../bridges/LivechatBridge';
export declare class LivechatRead implements ILivechatRead {
    private readonly livechatBridge;
    private readonly appId;
    constructor(livechatBridge: LivechatBridge, appId: string);
    /**
     * @deprecated please use the `isOnlineAsync` method instead.
     * In the next major, this method will be `async`
     */
    isOnline(departmentId?: string): boolean;
    isOnlineAsync(departmentId?: string): Promise<boolean>;
    getDepartmentsEnabledWithAgents(): Promise<Array<IDepartment>>;
    getLivechatRooms(visitor: IVisitor, departmentId?: string): Promise<Array<ILivechatRoom>>;
    getLivechatTotalOpenRoomsByAgentId(agentId: string): Promise<number>;
    getLivechatOpenRoomsByAgentId(agentId: string): Promise<Array<ILivechatRoom>>;
    /**
     * @deprecated This method does not adhere to the conversion practices applied
     * elsewhere in the Apps-Engine and will be removed in the next major version.
     * Prefer the alternative methods to fetch visitors.
     */
    getLivechatVisitors(query: object): Promise<Array<IVisitor>>;
    getLivechatVisitorById(id: string): Promise<IVisitor | undefined>;
    getLivechatVisitorByEmail(email: string): Promise<IVisitor | undefined>;
    getLivechatVisitorByToken(token: string): Promise<IVisitor | undefined>;
    getLivechatVisitorByPhoneNumber(phoneNumber: string): Promise<IVisitor | undefined>;
    getLivechatDepartmentByIdOrName(value: string): Promise<IDepartment | undefined>;
    _fetchLivechatRoomMessages(roomId: string): Promise<Array<IMessage>>;
}
