import { BaseBridge } from './BaseBridge';
import type { IExtraRoomParams } from '../../definition/accessors/ILivechatCreator';
import type { IDepartment, ILivechatMessage, ILivechatRoom, ILivechatTransferData, IVisitor } from '../../definition/livechat';
import type { IMessage } from '../../definition/messages';
import type { IUser } from '../../definition/users';
export declare abstract class LivechatBridge extends BaseBridge {
    doIsOnline(departmentId?: string, appId?: string): boolean;
    doIsOnlineAsync(departmentId?: string, appId?: string): Promise<boolean>;
    doCreateMessage(message: ILivechatMessage, appId: string): Promise<string>;
    doGetMessageById(messageId: string, appId: string): Promise<ILivechatMessage>;
    doUpdateMessage(message: ILivechatMessage, appId: string): Promise<void>;
    /**
     * @deprecated please use the `doCreateAndReturnVisitor` method instead.
     */
    doCreateVisitor(visitor: IVisitor, appId: string): Promise<string>;
    doCreateAndReturnVisitor(visitor: IVisitor, appId: string): Promise<IVisitor | undefined>;
    doFindVisitors(query: object, appId: string): Promise<Array<IVisitor>>;
    doFindVisitorById(id: string, appId: string): Promise<IVisitor | undefined>;
    doFindVisitorByEmail(email: string, appId: string): Promise<IVisitor | undefined>;
    doFindVisitorByToken(token: string, appId: string): Promise<IVisitor | undefined>;
    doFindVisitorByPhoneNumber(phoneNumber: string, appId: string): Promise<IVisitor | undefined>;
    doTransferVisitor(visitor: IVisitor, transferData: ILivechatTransferData, appId: string): Promise<boolean>;
    doCreateRoom(visitor: IVisitor, agent: IUser, appId: string, extraParams?: IExtraRoomParams): Promise<ILivechatRoom>;
    doCloseRoom(room: ILivechatRoom, comment: string, closer: IUser | undefined, appId: string): Promise<boolean>;
    doCountOpenRoomsByAgentId(agentId: string, appId: string): Promise<number>;
    doFindOpenRoomsByAgentId(agentId: string, appId: string): Promise<Array<ILivechatRoom>>;
    doFindRooms(visitor: IVisitor, departmentId: string | null, appId: string): Promise<Array<ILivechatRoom>>;
    doFindDepartmentByIdOrName(value: string, appId: string): Promise<IDepartment | undefined>;
    doFindDepartmentsEnabledWithAgents(appId: string): Promise<Array<IDepartment>>;
    do_fetchLivechatRoomMessages(appId: string, roomId: string): Promise<Array<IMessage>>;
    doSetCustomFields(data: {
        token: IVisitor['token'];
        key: string;
        value: string;
        overwrite: boolean;
    }, appId: string): Promise<number>;
    /**
     * @deprecated please use the `isOnlineAsync` method instead.
     * In the next major, this method will be `async`
     */
    protected abstract isOnline(departmentId?: string, appId?: string): boolean;
    protected abstract isOnlineAsync(departmentId?: string, appId?: string): Promise<boolean>;
    protected abstract createMessage(message: ILivechatMessage, appId: string): Promise<string>;
    protected abstract getMessageById(messageId: string, appId: string): Promise<ILivechatMessage>;
    protected abstract updateMessage(message: ILivechatMessage, appId: string): Promise<void>;
    /**
     * @deprecated please use `createAndReturnVisitor` instead.
     * It returns the created record rather than the ID.
     */
    protected abstract createVisitor(visitor: IVisitor, appId: string): Promise<string>;
    protected abstract createAndReturnVisitor(visitor: IVisitor, appId: string): Promise<IVisitor | undefined>;
    /**
     * @deprecated This method does not adhere to the conversion practices applied
     * elsewhere in the Apps-Engine and will be removed in the next major version.
     * Prefer other methods that fetch visitors.
     */
    protected abstract findVisitors(query: object, appId: string): Promise<Array<IVisitor>>;
    protected abstract findVisitorById(id: string, appId: string): Promise<IVisitor | undefined>;
    protected abstract findVisitorByEmail(email: string, appId: string): Promise<IVisitor | undefined>;
    protected abstract findVisitorByToken(token: string, appId: string): Promise<IVisitor | undefined>;
    protected abstract findVisitorByPhoneNumber(phoneNumber: string, appId: string): Promise<IVisitor | undefined>;
    protected abstract transferVisitor(visitor: IVisitor, transferData: ILivechatTransferData, appId: string): Promise<boolean>;
    protected abstract createRoom(visitor: IVisitor, agent: IUser, appId: string, extraParams?: IExtraRoomParams): Promise<ILivechatRoom>;
    protected abstract closeRoom(room: ILivechatRoom, comment: string, closer: IUser | undefined, appId: string): Promise<boolean>;
    protected abstract countOpenRoomsByAgentId(agentId: string, appId: string): Promise<number>;
    protected abstract findOpenRoomsByAgentId(agentId: string, appId: string): Promise<Array<ILivechatRoom>>;
    protected abstract findRooms(visitor: IVisitor, departmentId: string | null, appId: string): Promise<Array<ILivechatRoom>>;
    protected abstract findDepartmentByIdOrName(value: string, appId: string): Promise<IDepartment | undefined>;
    protected abstract findDepartmentsEnabledWithAgents(appId: string): Promise<Array<IDepartment>>;
    protected abstract _fetchLivechatRoomMessages(appId: string, roomId: string): Promise<Array<IMessage>>;
    protected abstract setCustomFields(data: {
        token: IVisitor['token'];
        key: string;
        value: string;
        overwrite: boolean;
    }, appId: string): Promise<number>;
    private hasReadPermission;
    private hasWritePermission;
    private hasMultiplePermission;
}
