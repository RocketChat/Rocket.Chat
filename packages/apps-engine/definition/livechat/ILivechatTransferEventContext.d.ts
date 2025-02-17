import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { IDepartment } from './IDepartment';
export declare enum LivechatTransferEventType {
    AGENT = "agent",
    DEPARTMENT = "department"
}
export interface ILivechatTransferEventContext {
    type: LivechatTransferEventType;
    room: IRoom;
    from: IUser | IDepartment;
    to: IUser | IDepartment;
}
