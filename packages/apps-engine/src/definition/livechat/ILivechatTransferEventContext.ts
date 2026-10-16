import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { IDepartment } from './IDepartment';

/** What a conversation was handed over to. */
export enum LivechatTransferEventType {
	/** Handed to a named agent. */
	AGENT = 'agent',
	/** Handed to a department, which routes it on. */
	DEPARTMENT = 'department',
}

/**
 * A conversation that has just been handed over, as
 * `IPostLivechatRoomTransferred` sees it.
 *
 * {@link ILivechatTransferEventContext.type} says which of `IUser` and
 * `IDepartment` the two ends are.
 */
export interface ILivechatTransferEventContext {
	/** Whether the conversation went to an agent or to a department. */
	type: LivechatTransferEventType;
	/** The conversation that moved. */
	room: IRoom;
	/** Who was serving it before. */
	from: IUser | IDepartment;
	/** Who serves it now. */
	to: IUser | IDepartment;
}
