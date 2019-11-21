import { IUser } from '../IUser';

export interface IEDataMessage {
    u: IUser;
    msg: string;
    mentions?: string[];
    channels?: string[];
    reactions?: object[];
}
