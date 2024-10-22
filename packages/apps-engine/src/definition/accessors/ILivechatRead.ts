import type { IDepartment } from '../livechat';
import type { ILivechatRoom } from '../livechat/ILivechatRoom';
import type { IVisitor } from '../livechat/IVisitor';
import type { IMessage } from '../messages';

export interface ILivechatRead {
    /**
     * Gets online status of the livechat.
     * @param departmentId (optional) the id of the livechat department
     * @deprecated use `isOnlineAsync` instead
     */
    isOnline(departmentId?: string): boolean;
    /**
     * Gets online status of the livechat.
     * @param departmentId (optional) the id of the livechat department
     */
    isOnlineAsync(departmentId?: string): Promise<boolean>;
    getDepartmentsEnabledWithAgents(): Promise<Array<IDepartment>>;
    getLivechatRooms(visitor: IVisitor, departmentId?: string): Promise<Array<ILivechatRoom>>;
    getLivechatOpenRoomsByAgentId(agentId: string): Promise<Array<ILivechatRoom>>;
    getLivechatTotalOpenRoomsByAgentId(agentId: string): Promise<number>;
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
    /**
     * @experimental we do not encourage the wider usage of this method,
     * as we're evaluating its performance and fit for the API.
     */
    _fetchLivechatRoomMessages(roomId: string): Promise<Array<IMessage>>;
}
