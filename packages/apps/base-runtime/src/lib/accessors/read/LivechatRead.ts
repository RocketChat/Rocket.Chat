import type { ILivechatRead } from '@rocket.chat/apps-engine/definition/accessors/ILivechatRead';
import type { IDepartment } from '@rocket.chat/apps-engine/definition/livechat';
import type { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat/ILivechatRoom';
import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat/IVisitor';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class LivechatRead implements ILivechatRead {
	constructor(private readonly bridges: RemoteBridges) {}

	/**
	 * @deprecated please use the `isOnlineAsync` method instead.
	 * In the next major, this method will be `async`
	 *
	 * NOTE: the underlying bridge call is asynchronous, so unlike the (formerly
	 * synchronous, host-resolved) accessor this returns a Promise. This matches
	 * how every other bridge call behaves from inside the subprocess and preserves
	 * the deprecation warning.
	 */
	public isOnline(departmentId?: string): boolean {
		console.warn(
			"The `LivechatRead.isOnline` method is deprecated and won't behave as intended. Please use `LivechatRead.isOnlineAsync` instead",
		);

		return this.bridges.getLivechatBridge().doIsOnline(departmentId, 'APP_ID') as unknown as boolean;
	}

	public isOnlineAsync(departmentId?: string): Promise<boolean> {
		return this.bridges.getLivechatBridge().doIsOnlineAsync(departmentId, 'APP_ID') as Promise<boolean>;
	}

	public getDepartmentsEnabledWithAgents(): Promise<Array<IDepartment>> {
		return this.bridges.getLivechatBridge().doFindDepartmentsEnabledWithAgents('APP_ID') as Promise<Array<IDepartment>>;
	}

	public getLivechatRooms(visitor: IVisitor, departmentId?: string): Promise<Array<ILivechatRoom>> {
		return this.bridges.getLivechatBridge().doFindRooms(visitor, departmentId, 'APP_ID') as Promise<Array<ILivechatRoom>>;
	}

	public getLivechatTotalOpenRoomsByAgentId(agentId: string): Promise<number> {
		return this.bridges.getLivechatBridge().doCountOpenRoomsByAgentId(agentId, 'APP_ID') as Promise<number>;
	}

	public getLivechatOpenRoomsByAgentId(agentId: string): Promise<Array<ILivechatRoom>> {
		return this.bridges.getLivechatBridge().doFindOpenRoomsByAgentId(agentId, 'APP_ID') as Promise<Array<ILivechatRoom>>;
	}

	/**
	 * @deprecated This method does not adhere to the conversion practices applied
	 * elsewhere in the Apps-Engine and will be removed in the next major version.
	 * Prefer the alternative methods to fetch visitors.
	 */
	public getLivechatVisitors(query: object): Promise<Array<IVisitor>> {
		return this.bridges.getLivechatBridge().doFindVisitors(query, 'APP_ID') as Promise<Array<IVisitor>>;
	}

	public getLivechatVisitorById(id: string): Promise<IVisitor | undefined> {
		return this.bridges.getLivechatBridge().doFindVisitorById(id, 'APP_ID') as Promise<IVisitor | undefined>;
	}

	public getLivechatVisitorByEmail(email: string): Promise<IVisitor | undefined> {
		return this.bridges.getLivechatBridge().doFindVisitorByEmail(email, 'APP_ID') as Promise<IVisitor | undefined>;
	}

	public getLivechatVisitorByToken(token: string): Promise<IVisitor | undefined> {
		return this.bridges.getLivechatBridge().doFindVisitorByToken(token, 'APP_ID') as Promise<IVisitor | undefined>;
	}

	public getLivechatVisitorByPhoneNumber(phoneNumber: string): Promise<IVisitor | undefined> {
		return this.bridges.getLivechatBridge().doFindVisitorByPhoneNumber(phoneNumber, 'APP_ID') as Promise<IVisitor | undefined>;
	}

	public getLivechatDepartmentByIdOrName(value: string): Promise<IDepartment | undefined> {
		return this.bridges.getLivechatBridge().doFindDepartmentByIdOrName(value, 'APP_ID') as Promise<IDepartment | undefined>;
	}

	public _fetchLivechatRoomMessages(roomId: string): Promise<Array<IMessage>> {
		return this.bridges.getLivechatBridge().do_fetchLivechatRoomMessages('APP_ID', roomId) as Promise<Array<IMessage>>;
	}
}
