import { BaseBridge } from './BaseBridge';
import type { IExtraRoomParams } from '../../definition/accessors/ILivechatCreator';
import type { IDepartment, ILivechatMessage, ILivechatRoom, ILivechatTransferData, IVisitor } from '../../definition/livechat';
import type { IMessage } from '../../definition/messages';
import type { IUser } from '../../definition/users';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

type LivechatReadPermissions = keyof Pick<
    typeof AppPermissions,
    'livechat-department' | 'livechat-message' | 'livechat-room' | 'livechat-status' | 'livechat-visitor'
>;

type LivechatWritePermissions = keyof Pick<
    typeof AppPermissions,
    'livechat-custom-fields' | 'livechat-department' | 'livechat-message' | 'livechat-room' | 'livechat-visitor'
>;

type LivechatMultiplePermissions = keyof Pick<typeof AppPermissions, 'livechat-department' | 'livechat-message'>;

export abstract class LivechatBridge extends BaseBridge {
    public doIsOnline(departmentId?: string, appId?: string): boolean {
        if (this.hasReadPermission(appId, 'livechat-status')) {
            return this.isOnline(departmentId, appId);
        }
    }

    public async doIsOnlineAsync(departmentId?: string, appId?: string): Promise<boolean> {
        if (this.hasReadPermission(appId, 'livechat-status')) {
            return this.isOnlineAsync(departmentId, appId);
        }
    }

    public async doCreateMessage(message: ILivechatMessage, appId: string): Promise<string> {
        if (this.hasWritePermission(appId, 'livechat-message')) {
            return this.createMessage(message, appId);
        }
    }

    public async doGetMessageById(messageId: string, appId: string): Promise<ILivechatMessage> {
        if (this.hasReadPermission(appId, 'livechat-message')) {
            return this.getMessageById(messageId, appId);
        }
    }

    public async doUpdateMessage(message: ILivechatMessage, appId: string): Promise<void> {
        if (this.hasWritePermission(appId, 'livechat-message')) {
            return this.updateMessage(message, appId);
        }
    }

    /**
     * @deprecated please use the `doCreateAndReturnVisitor` method instead.
     */
    public async doCreateVisitor(visitor: IVisitor, appId: string): Promise<string> {
        if (this.hasWritePermission(appId, 'livechat-visitor')) {
            return this.createVisitor(visitor, appId);
        }
    }

    public async doCreateAndReturnVisitor(visitor: IVisitor, appId: string): Promise<IVisitor | undefined> {
        if (this.hasWritePermission(appId, 'livechat-visitor')) {
            return this.createAndReturnVisitor(visitor, appId);
        }
    }

    public async doFindVisitors(query: object, appId: string): Promise<Array<IVisitor>> {
        if (this.hasReadPermission(appId, 'livechat-visitor')) {
            return this.findVisitors(query, appId);
        }
    }

    public async doFindVisitorById(id: string, appId: string): Promise<IVisitor | undefined> {
        if (this.hasReadPermission(appId, 'livechat-visitor')) {
            return this.findVisitorById(id, appId);
        }
    }

    public async doFindVisitorByEmail(email: string, appId: string): Promise<IVisitor | undefined> {
        if (this.hasReadPermission(appId, 'livechat-visitor')) {
            return this.findVisitorByEmail(email, appId);
        }
    }

    public async doFindVisitorByToken(token: string, appId: string): Promise<IVisitor | undefined> {
        if (this.hasReadPermission(appId, 'livechat-visitor')) {
            return this.findVisitorByToken(token, appId);
        }
    }

    public async doFindVisitorByPhoneNumber(phoneNumber: string, appId: string): Promise<IVisitor | undefined> {
        if (this.hasReadPermission(appId, 'livechat-visitor')) {
            return this.findVisitorByPhoneNumber(phoneNumber, appId);
        }
    }

    public async doTransferVisitor(visitor: IVisitor, transferData: ILivechatTransferData, appId: string): Promise<boolean> {
        if (this.hasWritePermission(appId, 'livechat-visitor')) {
            return this.transferVisitor(visitor, transferData, appId);
        }
    }

    public async doCreateRoom(visitor: IVisitor, agent: IUser, appId: string, extraParams?: IExtraRoomParams): Promise<ILivechatRoom> {
        if (this.hasWritePermission(appId, 'livechat-room')) {
            return this.createRoom(visitor, agent, appId, extraParams);
        }
    }

    public async doCloseRoom(room: ILivechatRoom, comment: string, closer: IUser | undefined, appId: string): Promise<boolean> {
        if (this.hasWritePermission(appId, 'livechat-room')) {
            return this.closeRoom(room, comment, closer, appId);
        }
    }

    public async doCountOpenRoomsByAgentId(agentId: string, appId: string): Promise<number> {
        if (this.hasReadPermission(appId, 'livechat-room')) {
            return this.countOpenRoomsByAgentId(agentId, appId);
        }
    }

    public async doFindOpenRoomsByAgentId(agentId: string, appId: string): Promise<Array<ILivechatRoom>> {
        if (this.hasReadPermission(appId, 'livechat-room')) {
            return this.findOpenRoomsByAgentId(agentId, appId);
        }
    }

    public async doFindRooms(visitor: IVisitor, departmentId: string | null, appId: string): Promise<Array<ILivechatRoom>> {
        if (this.hasReadPermission(appId, 'livechat-room')) {
            return this.findRooms(visitor, departmentId, appId);
        }
    }

    public async doFindDepartmentByIdOrName(value: string, appId: string): Promise<IDepartment | undefined> {
        if (this.hasReadPermission(appId, 'livechat-department') || this.hasMultiplePermission(appId, 'livechat-department')) {
            return this.findDepartmentByIdOrName(value, appId);
        }
    }

    public async doFindDepartmentsEnabledWithAgents(appId: string): Promise<Array<IDepartment>> {
        if (this.hasMultiplePermission(appId, 'livechat-department')) {
            return this.findDepartmentsEnabledWithAgents(appId);
        }
    }

    public async do_fetchLivechatRoomMessages(appId: string, roomId: string): Promise<Array<IMessage>> {
        if (this.hasMultiplePermission(appId, 'livechat-message')) {
            return this._fetchLivechatRoomMessages(appId, roomId);
        }
    }

    public async doSetCustomFields(data: { token: IVisitor['token']; key: string; value: string; overwrite: boolean }, appId: string): Promise<number> {
        if (this.hasWritePermission(appId, 'livechat-custom-fields')) {
            return this.setCustomFields(data, appId);
        }
    }

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

    protected abstract setCustomFields(data: { token: IVisitor['token']; key: string; value: string; overwrite: boolean }, appId: string): Promise<number>;

    private hasReadPermission(appId: string, scope: LivechatReadPermissions): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions[scope].read)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions[scope].read],
            }),
        );

        return false;
    }

    private hasWritePermission(appId: string, scope: LivechatWritePermissions): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions[scope].write)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions[scope].write],
            }),
        );

        return false;
    }

    private hasMultiplePermission(appId: string, scope: LivechatMultiplePermissions): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions[scope].multiple)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions[scope].multiple],
            }),
        );

        return false;
    }
}
