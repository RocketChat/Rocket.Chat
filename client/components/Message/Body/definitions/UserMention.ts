import { IUser } from '../../../../../definition/IUser';

export type UserMention = Pick<IUser, '_id' | 'name' | 'username'>;
