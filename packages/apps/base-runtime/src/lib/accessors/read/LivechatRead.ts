import type { ILivechatRead } from '@rocket.chat/apps-engine/definition/accessors/ILivechatRead';
import type { IDepartment } from '@rocket.chat/apps-engine/definition/livechat';
import type { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat/ILivechatRoom';
import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat/IVisitor';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class LivechatRead implements ILivechatRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	/**
	 * @deprecated please use the `isOnlineAsync` method instead.
	 * In the next major, this method will be `async`
	 *
	 * NOTE: this really returns a Promise - the declared `boolean` comes from
	 * `ILivechatRead`, which cannot change before that major. Calls of the form
	 * `read.getLivechatReader().isOnline(...)` are rewritten to `await` it at load time by
	 * `fixLivechatIsOnlineCalls` (see `lib/ast/operations.ts`, reached via
	 * `sanitizeDeprecatedUsage`). A stored reference (`const r = read.getLivechatReader()`)
	 * is not rewritten and will observe the raw Promise.
	 */
	public isOnline(departmentId?: string): boolean {
		console.warn(
			"The `LivechatRead.isOnline` method is deprecated and won't behave as intended. Please use `LivechatRead.isOnlineAsync` instead",
		);

		return bridgeCall(this.senderFn, 'getLivechatBridge', 'doIsOnline', departmentId, 'APP_ID') as unknown as boolean;
	}

	public isOnlineAsync(departmentId?: string): Promise<boolean> {
		return bridgeCall<boolean>(this.senderFn, 'getLivechatBridge', 'doIsOnlineAsync', departmentId, 'APP_ID');
	}

	public getDepartmentsEnabledWithAgents(): Promise<Array<IDepartment>> {
		return bridgeCall<Array<IDepartment>>(this.senderFn, 'getLivechatBridge', 'doFindDepartmentsEnabledWithAgents', 'APP_ID');
	}

	public getLivechatRooms(visitor: IVisitor, departmentId?: string): Promise<Array<ILivechatRoom>> {
		return bridgeCall<Array<ILivechatRoom>>(this.senderFn, 'getLivechatBridge', 'doFindRooms', visitor, departmentId, 'APP_ID');
	}

	public getLivechatTotalOpenRoomsByAgentId(agentId: string): Promise<number> {
		return bridgeCall<number>(this.senderFn, 'getLivechatBridge', 'doCountOpenRoomsByAgentId', agentId, 'APP_ID');
	}

	public getLivechatOpenRoomsByAgentId(agentId: string): Promise<Array<ILivechatRoom>> {
		return bridgeCall<Array<ILivechatRoom>>(this.senderFn, 'getLivechatBridge', 'doFindOpenRoomsByAgentId', agentId, 'APP_ID');
	}

	/**
	 * @deprecated This method does not adhere to the conversion practices applied
	 * elsewhere in the Apps-Engine and will be removed in the next major version.
	 * Prefer the alternative methods to fetch visitors.
	 */
	public getLivechatVisitors(query: object): Promise<Array<IVisitor>> {
		return bridgeCall<Array<IVisitor>>(this.senderFn, 'getLivechatBridge', 'doFindVisitors', query, 'APP_ID');
	}

	public getLivechatVisitorById(id: string): Promise<IVisitor | undefined> {
		return bridgeCall<IVisitor | undefined>(this.senderFn, 'getLivechatBridge', 'doFindVisitorById', id, 'APP_ID');
	}

	public getLivechatVisitorByEmail(email: string): Promise<IVisitor | undefined> {
		return bridgeCall<IVisitor | undefined>(this.senderFn, 'getLivechatBridge', 'doFindVisitorByEmail', email, 'APP_ID');
	}

	public getLivechatVisitorByToken(token: string): Promise<IVisitor | undefined> {
		return bridgeCall<IVisitor | undefined>(this.senderFn, 'getLivechatBridge', 'doFindVisitorByToken', token, 'APP_ID');
	}

	public getLivechatVisitorByPhoneNumber(phoneNumber: string): Promise<IVisitor | undefined> {
		return bridgeCall<IVisitor | undefined>(this.senderFn, 'getLivechatBridge', 'doFindVisitorByPhoneNumber', phoneNumber, 'APP_ID');
	}

	public getLivechatDepartmentByIdOrName(value: string): Promise<IDepartment | undefined> {
		return bridgeCall<IDepartment | undefined>(this.senderFn, 'getLivechatBridge', 'doFindDepartmentByIdOrName', value, 'APP_ID');
	}

	public _fetchLivechatRoomMessages(roomId: string): Promise<Array<IMessage>> {
		return bridgeCall<Array<IMessage>>(this.senderFn, 'getLivechatBridge', 'do_fetchLivechatRoomMessages', 'APP_ID', roomId);
	}
}
