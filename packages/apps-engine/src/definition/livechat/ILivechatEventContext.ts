import type { IUser } from '../users';
import type { ILivechatRoom } from './ILivechatRoom';

export interface ILivechatEventContext {
    agent: IUser;
    room: ILivechatRoom;
}
