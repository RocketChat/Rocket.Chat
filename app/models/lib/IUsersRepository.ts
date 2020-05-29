import { IOptions } from './IOptions';
import { IUser } from '../../../definition/IUser';

export interface IUsersRepository {
	findOneById(userId: string, options?: IOptions): IUser;
}
