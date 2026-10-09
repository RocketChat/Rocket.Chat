import type { IUser } from '../users';
import type { ILivechatRoom } from './ILivechatRoom';

/**
 * Where an App wants a conversation handed over to, passed to
 * `ILivechatUpdater.transferVisitor`.
 *
 * Name one destination: an agent to hand it to, or a department to let route
 * it.
 */
export interface ILivechatTransferData {
	/** The conversation to move. */
	currentRoom: ILivechatRoom;
	/** The agent to hand the conversation to. */
	targetAgent?: IUser;
	/** The id of the department to hand the conversation to. */
	targetDepartment?: string;
}
