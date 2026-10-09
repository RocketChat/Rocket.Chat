import type { IUser } from './IUser';
import type { UserType } from './UserType';

/**
 * A user an App speaks as, created through `IModifyCreator.startBotUser`.
 *
 * It carries no email addresses: nobody logs into it and nothing is sent to it.
 */
export interface IBotUser extends Omit<IUser, 'emails'> {
	type: UserType.BOT | UserType.APP;
}
