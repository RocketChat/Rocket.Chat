import { IUser } from '../IUser';

export interface IEDataMessage {
	u: IUser;
	msg: string;
	mentions?: Array<string>;
	channels?: Array<string>;
	reactions?: Array<object>;
	pinned?: Array<object>;
	starred?: Array<object>;
}
