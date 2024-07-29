import type { IUser } from './IUser';
import type { UserType } from './UserType';

export interface IBotUser extends Omit<IUser, 'emails'> {
    type: UserType.BOT | UserType.APP;
}
