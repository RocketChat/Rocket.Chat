import type { IExtraRoomParams } from '../../../src/definition/accessors/ILivechatCreator';
import type { IDepartment, ILivechatMessage, ILivechatRoom, ILivechatTransferData, IVisitor } from '../../../src/definition/livechat';
import type { IMessage } from '../../../src/definition/messages';
import type { IUser } from '../../../src/definition/users';
import { LivechatBridge } from '../../../src/server/bridges/LivechatBridge';

export class TestLivechatBridge extends LivechatBridge {
    public findDepartmentsEnabledWithAgents(appId: string): Promise<Array<IDepartment>> {
        throw new Error('Method not implemented.');
    }

    public isOnline(departmentId?: string): boolean {
        throw new Error('Method not implemented');
    }

    public isOnlineAsync(departmentId?: string): Promise<boolean> {
        throw new Error('Method not implemented');
    }

    public createMessage(message: ILivechatMessage, appId: string): Promise<string> {
        throw new Error('Method not implemented');
    }

    public getMessageById(messageId: string, appId: string): Promise<ILivechatMessage> {
        throw new Error('Method not implemented');
    }

    public updateMessage(message: ILivechatMessage, appId: string): Promise<void> {
        throw new Error('Method not implemented');
    }

    public createVisitor(visitor: IVisitor, appId: string): Promise<string> {
        throw new Error('Method not implemented');
    }

    public createAndReturnVisitor(visitor: IVisitor, appId: string): Promise<IVisitor | undefined> {
        throw new Error('Method not implemented');
    }

    public transferVisitor(visitor: IVisitor, transferData: ILivechatTransferData, appId: string): Promise<boolean> {
        throw new Error('Method not implemented');
    }

    public findVisitors(query: object, appId: string): Promise<Array<IVisitor>> {
        console.warn('The method AppLivechatBridge.findVisitors is deprecated. Please consider using its alternatives');
        throw new Error('Method not implemented');
    }

    public findVisitorById(id: string, appId: string): Promise<IVisitor | undefined> {
        throw new Error('Method not implemented');
    }

    public findVisitorByEmail(email: string, appId: string): Promise<IVisitor | undefined> {
        throw new Error('Method not implemented');
    }

    public findVisitorByToken(token: string, appId: string): Promise<IVisitor | undefined> {
        throw new Error('Method not implemented');
    }

    public findVisitorByPhoneNumber(phoneNumber: string, appId: string): Promise<IVisitor | undefined> {
        throw new Error('Method not implemented');
    }

    public createRoom(visitor: IVisitor, agent: IUser, appId: string, extraParams?: IExtraRoomParams): Promise<ILivechatRoom> {
        throw new Error('Method not implemented');
    }

    public closeRoom(room: ILivechatRoom, comment: string, closer: IUser | undefined, appId: string): Promise<boolean> {
        throw new Error('Method not implemented');
    }

    public findRooms(visitor: IVisitor, departmentId: string | null, appId: string): Promise<Array<ILivechatRoom>> {
        throw new Error('Method not implemented');
    }

    public findOpenRoomsByAgentId(agentId: string, appId: string): Promise<ILivechatRoom[]> {
        throw new Error('Method not implemented');
    }

    public countOpenRoomsByAgentId(agentId: string, appId: string): Promise<number> {
        throw new Error('Method not implemented');
    }

    public findDepartmentByIdOrName(value: string, appId: string): Promise<IDepartment | undefined> {
        throw new Error('Method not implemented');
    }

    public _fetchLivechatRoomMessages(appId: string, roomId: string): Promise<Array<IMessage>> {
        throw new Error('Method not implemented');
    }

    public setCustomFields(data: { token: IVisitor['token']; key: string; value: string; overwrite: boolean }, appId: string): Promise<number> {
        throw new Error('Method not implemented');
    }
}
