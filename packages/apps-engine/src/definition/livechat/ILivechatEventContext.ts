import type { IUser } from '../users';
import type { IDepartment } from './IDepartment';
import type { ILivechatRoom } from './ILivechatRoom';

/** Which conversation an event happened in, and who was serving it. */
export interface ILivechatEventContext {
	/** The agent assigned to the conversation when the event happened. */
	agent: IUser;
	/** The conversation itself. */
	room: ILivechatRoom;
}

/** Which department an event happened to. */
export interface ILivechatDepartmentEventContext {
	/** The department as it stood when the event happened. */
	department: IDepartment;
}
